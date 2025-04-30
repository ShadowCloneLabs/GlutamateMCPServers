import { run } from '@jxa/run';

// Define types for our calendar events
interface CalendarEvent {
    id: string;
    title: string;
    location: string | null;
    notes: string | null;
    startDate: string | null;
    endDate: string | null;
    calendarName: string;
    isAllDay: boolean;
    url: string | null;
}

// Configuration for timeouts and limits
const CONFIG = {
    // Maximum time (in ms) to wait for calendar operations
    TIMEOUT_MS: 8000,
    // Maximum number of events to process per calendar
    MAX_EVENTS_PER_CALENDAR: 50,
    // Maximum number of calendars to process
    MAX_CALENDARS: 1
};

/**
 * Check if the Calendar app is accessible
 * @returns Promise resolving to true if Calendar is accessible, throws error otherwise
 */
async function checkCalendarAccess(): Promise<boolean> {
    try {
        // Try to access Calendar app as a simple test
        const result = await run(() => {
            try {
                // Try to directly access Calendar without launching it first
                const Calendar = Application("Calendar");
                Calendar.name(); // Just try to get the name to test access
                return true;
            } catch (e) {
                // Don't use console.log in JXA
                throw new Error("Cannot access Calendar app");
            }
        }) as boolean;
        
        return result;
    } catch (error) {
        console.error(`Cannot access Calendar app: ${error instanceof Error ? error.message : String(error)}`);
        return false;
    }
}

/**
 * Search for calendar events that match the search text
 * @param searchText Text to search for in event titles, locations, and notes
 * @param limit Optional limit on the number of results (default 10)
 * @param fromDate Optional start date for search range in ISO format (default: today)
 * @param toDate Optional end date for search range in ISO format (default: 30 days from now)
 * @returns Array of calendar events matching the search criteria
 */
async function searchEvents(
    searchText: string, 
    limit = 10, 
    fromDate?: string, 
    toDate?: string
): Promise<CalendarEvent[]> {
    try {
        if (!await checkCalendarAccess()) {
            return [];
        }

        console.error(`searchEvents - Processing calendars for search: "${searchText}"`);

        const events = await run((args: { 
            searchText: string, 
            limit: number, 
            fromDate?: string, 
            toDate?: string,
            maxEventsPerCalendar: number
        }) => {
            try {
                const Calendar = Application("Calendar");
                
                // Set default date range if not provided (today to 30 days from now)
                const today = new Date();
                const defaultStartDate = today;
                const defaultEndDate = new Date();
                defaultEndDate.setDate(today.getDate() + 30);
                
                const startDate = args.fromDate ? new Date(args.fromDate) : defaultStartDate;
                const endDate = args.toDate ? new Date(args.toDate) : defaultEndDate;
                
                // Array to store matching events
                const matchingEvents: CalendarEvent[] = [];
                
                // Get all calendars at once
                const allCalendars = Calendar.calendars();
                
                // Search in each calendar
                for (let i = 0; i < allCalendars.length && matchingEvents.length < args.limit; i++) {
                    try {
                        const calendar = allCalendars[i];
                        const calendarName = calendar.name();
                        
                        // Get all events from this calendar
                        const events = calendar.events.whose({
                            _and: [
                                { startDate: { _greaterThan: startDate }},
                                { endDate: { _lessThan: endDate}},
                                { summary: { _contains: args.searchText}}
                            ]
                        });

                        const convertedEvents = events();
                        
                        // Limit the number of events to process
                        const eventCount = Math.min(convertedEvents.length, args.maxEventsPerCalendar);
                        
                        // Filter events by date range and search text
                        for (let j = 0; j < eventCount && matchingEvents.length < args.limit; j++) {
                            const event = convertedEvents[j];
                            
                            try {
                                const eventStartDate = new Date(event.startDate());
                                const eventEndDate = new Date(event.endDate());
                                
                                // Skip events outside our date range
                                if (eventEndDate < startDate || eventStartDate > endDate) {
                                    continue;
                                }
                                
                                // Get event details
                                let title = "";
                                let location = "";
                                let notes = "";
                                
                                try { title = event.summary(); } catch (e) { title = "Unknown Title"; }
                                try { location = event.location() || ""; } catch (e) { location = ""; }
                                try { notes = event.description() || ""; } catch (e) { notes = ""; }
                                
                                // Check if event matches search text
                                if (
                                    title.toLowerCase().includes(args.searchText.toLowerCase()) ||
                                    location.toLowerCase().includes(args.searchText.toLowerCase()) ||
                                    notes.toLowerCase().includes(args.searchText.toLowerCase())
                                ) {
                                    // Create event object
                                    const eventData: CalendarEvent = {
                                        id: "",
                                        title: title,
                                        location: location,
                                        notes: notes,
                                        startDate: null,
                                        endDate: null,
                                        calendarName: calendarName,
                                        isAllDay: false,
                                        url: null
                                    };
                                    
                                    try { eventData.id = event.uid(); } 
                                    catch (e) { eventData.id = `unknown-${Date.now()}-${Math.random()}`; }
                                    
                                    try { eventData.startDate = eventStartDate.toISOString(); } 
                                    catch (e) { /* Keep as null */ }
                                    
                                    try { eventData.endDate = eventEndDate.toISOString(); } 
                                    catch (e) { /* Keep as null */ }
                                    
                                    try { eventData.isAllDay = event.alldayEvent(); } 
                                    catch (e) { /* Keep as false */ }
                                    
                                    try { eventData.url = event.url(); } 
                                    catch (e) { /* Keep as null */ }
                                    
                                    matchingEvents.push(eventData);
                                }
                            } catch (e) {
                                // Skip events we can't process
                                console.log("searchEvents - Error processing events: ----0----", JSON.stringify(e));
                            }
                        }
                    } catch (e) {
                        // Skip calendars we can't access
                        console.log("searchEvents - Error processing calendars: ----1----", JSON.stringify(e));
                    }
                }
                
                return matchingEvents;
            } catch (e) {
                return []; // Return empty array on any error
            }
        }, { 
            searchText, 
            limit, 
            fromDate, 
            toDate,
            maxEventsPerCalendar: CONFIG.MAX_EVENTS_PER_CALENDAR
        }) as CalendarEvent[];
        
        // If no events found, create dummy events
        if (events.length === 0) {
            console.error("searchEvents - No events found, creating dummy events");
            return [];
        }
        
        return events;
    } catch (error) {
        console.error(`Error searching events: ${error instanceof Error ? error.message : String(error)}`);
        // Fall back to dummy events on error
        return [];
    }
}


/**
 * Open a specific calendar event in the Calendar app
 * @param eventId ID of the event to open
 * @returns Result object indicating success or failure
 */
async function openEvent(eventId: string): Promise<{ success: boolean; message: string }> {
    try {
        if (!await checkCalendarAccess()) {
            return {
                success: false,
                message: "Cannot access Calendar app. Please grant access in System Settings > Privacy & Security > Automation."
            };
        }

        console.error(`openEvent - Attempting to open event with ID: ${eventId}`);

        const result = await run((args: { 
            eventId: string,
            maxEventsPerCalendar: number
        }) => {
            try {
                const Calendar = Application("Calendar");
                
                // Get all calendars at once
                const allCalendars = Calendar.calendars();
                
                // Search in each calendar
                for (let i = 0; i < allCalendars.length; i++) {
                    try {
                        const calendar = allCalendars[i];
                        
                        // Get the event from this calendar
                        const events = calendar.events.whose({
                            uid: { _equals: args.eventId }
                        });

                        const event = events[0]

                        if(event.uid() === args.eventId) {
                            Calendar.activate();
                            event.show();
                            return {
                                success: true,
                                message: `Successfully opened event: ${event.summary()}`
                            };
                        }
                        
                    } catch (e) {
                        // Skip calendars we can't access
                        console.log("openEvent - Error processing calendars: ----2----", JSON.stringify(e));
                    }
                }
                
                return {
                    success: false,
                    message: `No event found with ID: ${args.eventId}`
                };
            } catch (e) {
                return {
                    success: false,
                    message: "Error opening event"
                };
            }
        }, { 
            eventId,
            maxEventsPerCalendar: CONFIG.MAX_EVENTS_PER_CALENDAR
        }) as { success: boolean; message: string };
        
        return result;
    } catch (error) {
        return {
            success: false,
            message: `Error opening event: ${error instanceof Error ? error.message : String(error)}`
        };
    }
}

/**
 * Get all calendar events in a specified date range
 * @param limit Optional limit on the number of results (default 10)
 * @param fromDate Optional start date for search range in ISO format (default: today)
 * @param toDate Optional end date for search range in ISO format (default: 7 days from now)
 * @returns Array of calendar events in the specified date range
 */
async function getEvents(
    limit = 10, 
    fromDate?: string, 
    toDate?: string
): Promise<CalendarEvent[]> {
    try {
        console.error("getEvents - Starting to fetch calendar events");
        
        if (!await checkCalendarAccess()) {
            console.error("getEvents - Failed to access Calendar app");
            return [];
        }
        console.error("getEvents - Calendar access check passed");

        const events = await run((args: { 
            limit: number, 
            fromDate?: string, 
            toDate?: string,
            maxEventsPerCalendar: number
        }) => {
            try {
                // Access the Calendar app directly
                const Calendar = Application("Calendar");
                
                // Set default date range if not provided (today to 7 days from now)
                const today = new Date();
                const defaultStartDate = today;
                const defaultEndDate = new Date();
                defaultEndDate.setDate(today.getDate() + 7);
                
                const startDate = args.fromDate ? new Date(args.fromDate) : defaultStartDate;
                const endDate = args.toDate ? new Date(args.toDate) : defaultEndDate;
                
                const calendars = Calendar.calendars();

                // Array to store events
                const events: CalendarEvent[] = [];
                
                // Get events from each calendar
                for (const calender of calendars) {
                    if (events.length >= args.limit) break;
                    
                    try {
                        // Get all events from this calendar
                        const calendarEvents = calender.events.whose({
                            _and: [
                                { startDate: { _greaterThan: startDate }},
                                { endDate: { _lessThan: endDate}}
                            ]
                        });
                        const convertedEvents = calendarEvents();
                        
                        // Limit the number of events to process
                        const eventCount = Math.min(convertedEvents.length, args.maxEventsPerCalendar);
                        
                        // Process events
                        for (let i = 0; i < eventCount && events.length < args.limit; i++) {
                            const event = convertedEvents[i];
                            
                            try {
                                const eventStartDate = new Date(event.startDate());
                                const eventEndDate = new Date(event.endDate());
                                
                                // Skip events outside our date range
                                if (eventEndDate < startDate || eventStartDate > endDate) {
                                    continue;
                                }
                                
                                // Create event object
                                const eventData: CalendarEvent = {
                                    id: "",
                                    title: "Unknown Title",
                                    location: null,
                                    notes: null,
                                    startDate: null,
                                    endDate: null,
                                    calendarName: calender.name(),
                                    isAllDay: false,
                                    url: null
                                };
                                
                                try { eventData.id = event.uid(); } 
                                catch (e) { eventData.id = `unknown-${Date.now()}-${Math.random()}`; }
                                
                                try { eventData.title = event.summary(); } 
                                catch (e) { /* Keep default title */ }
                                
                                try { eventData.location = event.location(); } 
                                catch (e) { /* Keep as null */ }
                                
                                try { eventData.notes = event.description(); } 
                                catch (e) { /* Keep as null */ }
                                
                                try { eventData.startDate = eventStartDate.toISOString(); } 
                                catch (e) { /* Keep as null */ }
                                
                                try { eventData.endDate = eventEndDate.toISOString(); } 
                                catch (e) { /* Keep as null */ }
                                
                                try { eventData.isAllDay = event.alldayEvent(); } 
                                catch (e) { /* Keep as false */ }
                                
                                try { eventData.url = event.url(); } 
                                catch (e) { /* Keep as null */ }
                                
                                events.push(eventData);
                            } catch (e) {
                                // Skip events we can't process
                            }
                        }
                    } catch (e) {
                        // Skip calendars we can't access
                        console.log("getEvents - Error processing events: ----0----", JSON.stringify(e));
                    }
                }
                return events;
            } catch (e) {
                console.log("getEvents - Error processing events: ----1----", JSON.stringify(e));
                return []; // Return empty array on any error
            }
        }, { 
            limit, 
            fromDate, 
            toDate,
            maxEventsPerCalendar: CONFIG.MAX_EVENTS_PER_CALENDAR
        }) as CalendarEvent[];
        
        // If no events found, create dummy events
        if (events.length === 0) {
            console.error("getEvents - No events found, creating dummy events");
            return [];
        }
        
        return events;
    } catch (error) {
        console.error(`Error getting events: ${error instanceof Error ? error.message : String(error)}`);
        return [];
    }
}

/**
 * Create a new calendar event
 * @param title Title of the event
 * @param startDate Start date/time in ISO format
 * @param endDate End date/time in ISO format
 * @param location Optional location of the event
 * @param notes Optional notes for the event
 * @param isAllDay Optional flag to create an all-day event
 * @param calendarName Optional calendar name to add the event to (uses default if not specified)
 * @returns Result object indicating success or failure, including the created event ID
 */
async function createEvent(
    title: string,
    startDate: string,
    endDate: string,
    location?: string,
    notes?: string,
    isAllDay = false,
    calendarName?: string
): Promise<{ success: boolean; message: string; eventId?: string }> {
    try {
        if (!await checkCalendarAccess()) {
            return {
                success: false,
                message: "Cannot access Calendar app. Please grant access in System Settings > Privacy & Security > Automation."
            };
        }

        console.error(`createEvent - Attempting to create event: "${title}"`);

        const result = await run((args: {
            title: string,
            startDate: string,
            endDate: string,
            location?: string,
            notes?: string,
            isAllDay: boolean,
            calendarName?: string
        }) => {
            try {
                const Calendar = Application("Calendar");
                
                // Parse dates
                const startDateTime = new Date(args.startDate);
                const endDateTime = new Date(args.endDate);
                
                // Find the target calendar
                // biome-ignore lint/suspicious/noExplicitAny: <explanation>
                let targetCalendar: any;
                if (args.calendarName) {
                    // Find the specified calendar
                    const calendars = Calendar.calendars.whose({
                        name: { _equals: args.calendarName }
                    });
                    
                    if (calendars.length > 0) {
                        targetCalendar = calendars[0];
                    } else {
                        return {
                            success: false,
                            message: `Calendar "${args.calendarName}" not found.`
                        };
                    }
                } else {
                    // Use default calendar
                    // Calendar.defaultCalendar() doesn't exist - get the first calendar instead
                    const allCalendars = Calendar.calendars();
                    if (allCalendars.length === 0) {
                        return {
                            success: false,
                            message: "No calendars found in Calendar app."
                        };
                    }
                    targetCalendar = allCalendars[0];
                }
                
                // Create the new event
                const newEvent = Calendar.Event({
                    summary: args.title,
                    startDate: startDateTime,
                    endDate: endDateTime,
                    location: args.location || "",
                    description: args.notes || "",
                    alldayEvent: args.isAllDay
                });
                
                // Add the event to the calendar
                targetCalendar.events.push(newEvent);
                
                return {
                    success: true,
                    message: `Event "${args.title}" created successfully.`,
                    eventId: newEvent.uid()
                };
            } catch (e) {
                return {
                    success: false,
                    message: `Error creating event: ${e instanceof Error ? e.message : String(e)}`
                };
            }
        }, {
            title,
            startDate,
            endDate,
            location,
            notes,
            isAllDay,
            calendarName
        }) as { success: boolean; message: string; eventId?: string };
        
        return result;
    } catch (error) {
        return {
            success: false,
            message: `Error creating event: ${error instanceof Error ? error.message : String(error)}`
        };
    }
}

const calendar = {
    searchEvents,
    openEvent,
    getEvents,
    createEvent
};

export default calendar; 