interface SearchResult {
  title: string;
  url: string;
  displayUrl: string;
  snippet: string;
}

interface ContentResult extends SearchResult {
  content: string | null;
  error?: string;
}

interface SearchResponse {
  query: string;
  results: SearchResult[];
  error?: string;
}

interface ContentResponse {
  query: string;
  results: ContentResult[];
  error?: string;
}

interface RequestOptions {
  method?: string;
  headers?: Record<string, string>;
  timeout?: number;
  retries?: number;
}

/**
 * Makes an HTTP/HTTPS request with retry capability and returns the response as a string
 */
async function makeRequest(
  url: string,
  options: RequestOptions = {},
): Promise<string> {
  const retries = options.retries || 2;
  let lastError: Error | null = null;
  
  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      const response = await fetch(url, {
        method: options.method || 'GET',
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
          'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8',
          'Accept-Language': 'en-US,en;q=0.5',
          ...(options.headers || {})
        },
        signal: options.timeout ? AbortSignal.timeout(options.timeout) : undefined
      });

      if (!response.ok) {
        throw new Error(`Request failed with status code ${response.status}`);
      }

      return response.text();
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error));
      
      // Don't retry if it's an aborted request or timeout
      if (error instanceof DOMException && error.name === 'AbortError') {
        break;
      }
      
      // Only retry if we have attempts left
      if (attempt === retries) {
        break;
      }
      
      // Wait before retry (exponential backoff)
      await new Promise(resolve => setTimeout(resolve, 1000 * 2 ** attempt));
    }
  }
  
  throw lastError || new Error('Request failed');
}

/**
 * Cleans HTML entities and tags from text
 */
function cleanHTML(text: string): string {
  if (!text) return '';
  
  // Basic HTML entity decoding
  let decodedText = text
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#x27;/g, "'")
    .replace(/&#39;/g, "'")
    .replace(/&nbsp;/g, " ");

  // Remove HTML tags
  decodedText = decodedText.replace(/<[^>]+>/g, "");
  
  // Normalize whitespace
  decodedText = decodedText.replace(/\s+/g, " ").trim();

  return decodedText;
}

/**
 * Extracts search results from DuckDuckGo HTML response
 * Increased to handle more results and with more robust parsing
 */
function extractDDGResults(html: string): SearchResult[] {
  const results: SearchResult[] = [];

  // Find the results div
  const resultsMatch = html.match(/<div class="serp__results">(.*?)<div class="(nav-link|feedback-btn)"/s);
  if (!resultsMatch) return results;

  const resultsHtml = resultsMatch[1];

  // Find all result blocks
  const resultBlocks = resultsHtml.match(/<div class="result results_links results_links_deep web-result[^>]*>(.*?)<div class="clear"><\/div>/gs);
  if (!resultBlocks) return results;

  // Process results (increased from 3 to 10 for more comprehensive results)
  for (let i = 0; i < Math.min(10, resultBlocks.length); i++) {
    const block = resultBlocks[i];

    try {
      // Extract components using more reliable selectors
      const titleMatch = block.match(/<a rel="nofollow" class="result__a"[^>]*>(.*?)<\/a>/s);
      const urlMatch = block.match(/href="\/\/duckduckgo\.com\/l\/\?uddg=(.*?)(?:&|")/);
      const displayUrlMatch = block.match(/<a class="result__url"[^>]*>(.*?)<\/a>/s);
      const snippetMatch = block.match(/<a class="result__snippet"[^>]*>(.*?)<\/a>/s);

      if (titleMatch && urlMatch) {
        results.push({
          title: cleanHTML(titleMatch[1]),
          url: decodeURIComponent(urlMatch[1]),
          displayUrl: displayUrlMatch ? cleanHTML(displayUrlMatch[1]) : new URL(decodeURIComponent(urlMatch[1])).hostname,
          snippet: snippetMatch ? cleanHTML(snippetMatch[1]) : ""
        });
      }
    } catch (error) {
      console.error("Error parsing result block:", error);
      // Continue with next block even if one fails
    }
  }

  return results;
}

/**
 * Searches DuckDuckGo and returns results with improved error handling
 */
async function searchDuckDuckGo(query: string): Promise<SearchResponse> {
  try {
    const encodedQuery = encodeURIComponent(query);
    const searchUrl = `https://html.duckduckgo.com/html/?q=${encodedQuery}`;

    const html = await makeRequest(searchUrl, { 
      timeout: 10000,
      retries: 2
    });
    const results = extractDDGResults(html);

    if (results.length === 0) {
      // Try alternative parsing if the main one failed
      const alternativeResults = extractDDGResultsAlternative(html);
      if (alternativeResults.length > 0) {
        return {
          query,
          results: alternativeResults
        };
      }
      
      return {
        query,
        results: [],
        error: "No results found or couldn't parse results"
      };
    }

    return {
      query,
      results
    };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.error("DuckDuckGo search failed:", errorMessage);
    return {
      query,
      error: errorMessage,
      results: []
    };
  }
}

/**
 * Alternative extraction method in case the primary one fails
 */
function extractDDGResultsAlternative(html: string): SearchResult[] {
  const results: SearchResult[] = [];
  
  try {
    // Try to find result blocks with a more general approach
    const links = html.match(/<h2 class="result__title">.*?<a rel="nofollow" class="result__a".*?href=".*?uddg=(.*?)(?:&|").*?>(.*?)<\/a>.*?<a class="result__snippet".*?>(.*?)<\/a>/gs);
    
    if (!links) return results;
    
    for (const link of links) {
      const titleMatch = link.match(/<a rel="nofollow" class="result__a".*?>(.*?)<\/a>/s);
      const urlMatch = link.match(/href=".*?uddg=(.*?)(?:&|")/);
      const snippetMatch = link.match(/<a class="result__snippet".*?>(.*?)<\/a>/s);
      
      if (titleMatch && urlMatch) {
        results.push({
          title: cleanHTML(titleMatch[1]),
          url: decodeURIComponent(urlMatch[1]),
          displayUrl: new URL(decodeURIComponent(urlMatch[1])).hostname,
          snippet: snippetMatch ? cleanHTML(snippetMatch[1]) : ""
        });
      }
    }
  } catch (error) {
    console.error("Alternative extraction failed:", error);
  }
  
  return results;
}

/**
 * Extracts main content from HTML with improved detection of main content area
 */
function extractMainContent(content: string): string {
  if (!content) return '';
  
  try {
    // Remove common non-content elements
    const cleanedContent = content
      .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, " ")
      .replace(/<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/gi, " ")
      .replace(/<header\b[^<]*(?:(?!<\/header>)<[^<]*)*<\/header>/gi, " ")
      .replace(/<footer\b[^<]*(?:(?!<\/footer>)<[^<]*)*<\/footer>/gi, " ")
      .replace(/<nav\b[^<]*(?:(?!<\/nav>)<[^<]*)*<\/nav>/gi, " ")
      .replace(/<aside\b[^<]*(?:(?!<\/aside>)<[^<]*)*<\/aside>/gi, " ")
      .replace(/<form\b[^<]*(?:(?!<\/form>)<[^<]*)*<\/form>/gi, " ")
      .replace(/<!--.*?-->/gs, " ");

    // Prioritized content areas to check
    const contentSelectors = [
      /<main\b[^<]*(?:(?!<\/main>)<[^<]*)*<\/main>/gi,
      /<article\b[^<]*(?:(?!<\/article>)<[^<]*)*<\/article>/gi,
      /<div\s+(?:[^>]*\s+)?class\s*=\s*["'](?:[^"']*\s+)?(?:content|post-content|entry-content|article-content|page-content|main-content)[^"']*["'][^>]*>.*?<\/div>/gi,
      /<div\s+(?:[^>]*\s+)?id\s*=\s*["'](?:content|post-content|entry-content|article-content|page-content|main-content)["'][^>]*>.*?<\/div>/gi,
      /<body\b[^<]*(?:(?!<\/body>)<[^<]*)*<\/body>/gi,
    ];

    let mainContent = '';
    
    // Try each selector in order of priority
    for (const selector of contentSelectors) {
      const matches = cleanedContent.match(selector);
      if (matches && matches.length > 0) {
        // If we find multiple matches (e.g., multiple articles), concatenate them
        mainContent = matches.join(" ");
        break;
      }
    }
    
    // If no content found, use the whole HTML as fallback
    if (!mainContent) {
      mainContent = cleanedContent;
    }

    // Remove remaining HTML tags
    let textContent = mainContent.replace(/<[^>]+>/g, " ");

    // Clean up whitespace
    textContent = textContent.replace(/\s+/g, " ").trim();

    // Decode HTML entities
    textContent = cleanHTML(textContent);

    return textContent;
  } catch (error) {
    console.error("Error extracting main content:", error);
    return "Failed to extract content";
  }
}

/**
 * Fetch and extract content from a URL with improved error handling and timeout handling
 */
async function fetchPageContent(
  url: string,
): Promise<{ url: string; content: string | null; error?: string }> {
  try {
    // Set a shorter timeout for content requests
    const html = await makeRequest(url, { 
      timeout: 15000,
      retries: 1,
      headers: {
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
      }
    });
    
    let content = '';
    try {
      content = extractMainContent(html);
    } catch (contentError) {
      return {
        url,
        content: null,
        error: `Error extracting content: ${contentError instanceof Error ? contentError.message : String(contentError)}`
      };
    }

    // Extract title for reference
    const titleMatch = html.match(/<title[^>]*>(.*?)<\/title>/i);
    const title = titleMatch ? cleanHTML(titleMatch[1]) : "";

    return {
      url,
      content: content || `[No content extracted. Page title: ${title}]`,
    };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.error(`Error fetching content from ${url}:`, errorMessage);
    return {
      url,
      error: errorMessage,
      content: null,
    };
  }
}

/**
 * Complete web search function that fetches search results and their content
 * with better parallel processing and error handling
 */
export async function webSearch(query: string): Promise<ContentResponse> {
  try {
    // Step 1: Get search results from DuckDuckGo
    const searchResults = await searchDuckDuckGo(query);

    if (searchResults.error || searchResults.results.length === 0) {
      return {
        query,
        error: searchResults.error || "No search results found",
        results: [],
      };
    }

    // Step 2: Fetch content for each result (limit to 5 results to improve performance)
    const resultsToProcess = searchResults.results.slice(0, 5);
    
    // Use Promise.allSettled to ensure all requests complete, even if some fail
    const settledPromises = await Promise.allSettled(
      resultsToProcess.map(result => fetchPageContent(result.url))
    );

    // Process results
    const fullResults = resultsToProcess.map((result, index) => {
      const promise = settledPromises[index];
      
      if (promise.status === "fulfilled") {
        return {
          ...result,
          content: promise.value.content,
          error: promise.value.error
        };
      } else {
        // For rejected promises, return the result with an error
        return {
          ...result,
          content: null,
          error: `Failed to fetch content: ${promise.reason}`
        };
      }
    });

    return {
      query,
      results: fullResults,
    };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.error("Web search failed:", errorMessage);
    return {
      query,
      error: errorMessage,
      results: [],
    };
  }
}

export default {
  webSearch,
  searchDuckDuckGo,
  fetchPageContent,
};