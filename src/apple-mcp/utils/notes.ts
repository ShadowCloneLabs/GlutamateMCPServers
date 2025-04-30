import { run } from '@jxa/run';

type Note = {
    name: string;
    content: string;
};

type CreateNoteResult = {
    success: boolean;
    note?: Note;
    message?: string;
    folderName?: string;
    usedDefaultFolder?: boolean;
};
  
async function getAllNotes() {
    const notes: Note[] = await run(() => {
        const Notes = Application('Notes');
        const notes = Notes.notes();

        // biome-ignore lint/suspicious/noExplicitAny: <explanation>
        return notes.map((note: any) => ({
            name: note.name(),
            content: note.plaintext()
        }));
    });

    return notes;
}

async function findNote(searchText: string) {
    const notes: Note[] = await run((searchText: string) => {
        const Notes = Application('Notes');
        const notes = Notes.notes.whose({_or: [
            {name: {_contains: searchText}},
            {plaintext: {_contains: searchText}}
        ]})()
        // biome-ignore lint/suspicious/noExplicitAny: <explanation>
        return notes.length > 0 ? notes.map((note: any) => ({
            name: note.name(),
            content: note.plaintext()
        })) : [];
    }, searchText);

    if (notes.length === 0) {
        const allNotes = await getAllNotes();
        const closestMatch = allNotes.find(({name}) => 
            name.toLowerCase().includes(searchText.toLowerCase())
        );
        return closestMatch ? [{
            name: closestMatch.name,
            content: closestMatch.content
        }] : [];
    }

    return notes;
}

async function createNote(title: string, body: string, folderName: string = 'Claude'): Promise<CreateNoteResult> {
    try {
        // Format the body with proper markdown
        const formattedBody = body
            .replace(/^(#+)\s+(.+)$/gm, '$1 $2\n') // Add newline after headers
            .replace(/^-\s+(.+)$/gm, '\n- $1') // Add newline before list items
            .replace(/\n{3,}/g, '\n\n') // Remove excess newlines
            .trim();

        const result = await run((title: string, body: string, folderName: string) => {
            const Notes = Application('Notes');
            
            // Create the note
            let targetFolder;
            let usedDefaultFolder = false;
            let actualFolderName = folderName;
            
            try {
                // Try to find the specified folder
                const folders = Notes.folders();
                for (let i = 0; i < folders.length; i++) {
                    if (folders[i].name() === folderName) {
                        targetFolder = folders[i];
                        break;
                    }
                }
                
                // If the specified folder doesn't exist
                if (!targetFolder) {
                    if (folderName === 'Claude') {
                        // Try to create the Claude folder if it doesn't exist
                        Notes.make({new: 'folder', withProperties: {name: 'Claude'}});
                        usedDefaultFolder = true;
                        
                        // Find it again after creation
                        const updatedFolders = Notes.folders();
                        for (let i = 0; i < updatedFolders.length; i++) {
                            if (updatedFolders[i].name() === 'Claude') {
                                targetFolder = updatedFolders[i];
                                break;
                            }
                        }
                    } else {
                        throw new Error(`Folder "${folderName}" not found`);
                    }
                }
                
                // Create the note in the specified folder or default folder
                let newNote;
                if (targetFolder) {
                    newNote = Notes.make({new: 'note', withProperties: {name: title, body: body}, at: targetFolder});
                    actualFolderName = folderName;
                } else {
                    // Fall back to default folder
                    newNote = Notes.make({new: 'note', withProperties: {name: title, body: body}});
                    actualFolderName = 'Default';
                }
                
                return {
                    success: true,
                    note: {
                        name: title,
                        content: body
                    },
                    folderName: actualFolderName,
                    usedDefaultFolder: usedDefaultFolder
                };
            } catch (scriptError: any) {
                throw new Error(`AppleScript error: ${scriptError.message || String(scriptError)}`);
            }
        }, title, formattedBody, folderName);
        
        return result as CreateNoteResult;
    } catch (error) {
        return {
            success: false,
            message: `Failed to create note: ${error instanceof Error ? error.message : String(error)}`
        };
    }
}

export default { getAllNotes, findNote, createNote };
