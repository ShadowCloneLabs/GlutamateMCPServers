import { run } from '@jxa/run';
import { runAppleScript } from 'run-applescript';

async function checkContactsAccess(): Promise<boolean> {
    try {
        // Try to get the count of contacts as a simple test
        await runAppleScript(`
tell application "Contacts"
    count every person
end tell`);
        return true;
    } catch (error) {
        throw new Error("Cannot access Contacts app. Please grant access in System Preferences > Security & Privacy > Privacy > Contacts.");
    }
}

async function getAllNumbers() {
    try {
        if (!await checkContactsAccess()) {
            return {};
        }

        const nums: { [key: string]: string[] } = await run(() => {
            const Contacts = Application('Contacts');
            const people = Contacts.people();
            const phoneNumbers: { [key: string]: string[] } = {};

            for (const person of people) {
                try {
                    const name = person.name();
                    const phones = person.phones().map((phone: unknown) => (phone as { value: string }).value);

                    if (!phoneNumbers[name]) {
                        phoneNumbers[name] = [];
                    }
                    phoneNumbers[name] = [...phoneNumbers[name], ...phones];
                } catch (error) {
                    // Skip contacts that can't be processed
                }
            }

            return phoneNumbers;
        });

        return nums;
    } catch (error) {
        throw new Error(`Error accessing contacts: ${error instanceof Error ? error.message : String(error)}`);
    }
}

async function findNumber(name: string) {
    try {
        if (!await checkContactsAccess()) {
            return [];
        }

        const nums: string[] = await run((name: string) => {
            const Contacts = Application('Contacts');
            const people = Contacts.people.whose({name: {_contains: name}});
            const phones = people.length > 0 ? people[0].phones() : [];
            return phones.map((phone: unknown) => (phone as { value: string }).value);
        }, name);

        // If no numbers found, run getNumbers() to find the closest match
        if (nums.length === 0) {
            const allNumbers = await getAllNumbers();
            const closestMatch = Object.keys(allNumbers).find(personName => 
                personName.toLowerCase().includes(name.toLowerCase())
            );
            return closestMatch ? allNumbers[closestMatch] : [];
        }

        return nums;
    } catch (error) {
        throw new Error(`Error finding contact: ${error instanceof Error ? error.message : String(error)}`);
    }
}

async function findContactByPhone(phoneNumber: string): Promise<string | null> {
    try {
        if (!await checkContactsAccess()) {
            return null;
        }

        // Normalize the phone number for comparison
        const searchNumber = phoneNumber.replace(/[^0-9+]/g, '');
        
        // Get all contacts and their numbers
        const allContacts = await getAllNumbers();
        
        // Look for a match
        for (const [name, numbers] of Object.entries(allContacts)) {
            const normalizedNumbers = numbers.map(num => num.replace(/[^0-9+]/g, ''));
            if (normalizedNumbers.some(num => 
                num === searchNumber || 
                num === `+${searchNumber}` || 
                num === `+1${searchNumber}` ||
                `+1${num}` === searchNumber
            )) {
                return name;
            }
        }

        return null;
    } catch (error) {
        // Return null instead of throwing to handle gracefully
        return null;
    }
}

export default { getAllNumbers, findNumber, findContactByPhone };
