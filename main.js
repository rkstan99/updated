const fs = require('fs').promises;
const nodemailer = require('nodemailer');
const puppeteer = require('puppeteer-core');
const { replacePlaceholders } = require('./placeholders');

const sendAsImage = false; // Adjust this based on your requirement
const sendAttachment = true; // Adjust this based on your requirement
const hideFromMail = false;
const embedLink = true; // Toggle to embed URL as a hyperlink in the image

async function sendEmails() {
    try {
        // Read recipient list
        const recipients = (await fs.readFile('list.txt', 'utf8')).trim().split('\n');

        printHeader();

        let emailCount = 0;
        const cidMappings = require('./cids.json'); // Load CID mappings once

        for (const recipient of recipients) {
            try {
                // Load config file and replace placeholders
                const configFilePath = 'config.json';
                const configContent = await fs.readFile(configFilePath, 'utf8');
                const config = JSON.parse(replacePlaceholders(configContent, [recipient]));

                if (!config.enableCustomHeaders || !config.enableHTMLImage || !config.enableAttachment) {
                    throw new Error('Custom headers, HTML image, or attachment is not enabled in config.');
                }

                const mailOptions = {
                    subject: replacePlaceholders(config.subject || '', [recipient]),
                    from: hideFromMail ? `"${generateRandomString(2, 'upper')}.${generateRandomString(2, 'upper')}" <info@schreinerei-spuck.de>` : replacePlaceholders('"##stringupper2##" <info@schreinerei-spuck.de>', [recipient]),
                    to: recipient,
                };

                if (config.customHeaders) {
                    mailOptions.headers = config.customHeaders;
                }

                if (sendAsImage && config.enableHTMLImage) {
                    const imageUrl = await generateImageFromHTML('letter.html', recipient);
                    const imageHtml = embedLink ? `<a href="##link##"><img src="${imageUrl}" alt="Letter Image"></a>` : `<img src="${imageUrl}" alt="Letter Image">`;
                    mailOptions.html = replacePlaceholders(imageHtml, [recipient]);
                } else {
                    const letterContent = await fs.readFile('letter.html', 'utf8');
                    mailOptions.html = replacePlaceholders(letterContent, [recipient]);
                }

                // Attach images referenced in letter.html using CID mappings
                const attachments = Object.keys(cidMappings).map(cid => ({
                    filename: `${cid}.png`,
                    path: cidMappings[cid],
                    cid: cid,
                }));
                mailOptions.attachments = attachments;

                if (sendAttachment && config.enableAttachment) {
                    const attachmentContent = await fs.readFile('attach.html', 'utf8');
                    const formattedAttachmentContent = replacePlaceholders(attachmentContent, [recipient]);
                    const attachment = {
                        filename: `attachment_${recipient}.eml`,
                        content: formattedAttachmentContent,
                        contentType: 'eml/html',
                        disposition: 'attachment',
                    };
                    mailOptions.attachments.push(attachment);
                }

                mailOptions.priority = 'high';

                const emailTransporter = nodemailer.createTransport(config.smtp);
                await emailTransporter.sendMail(mailOptions);
                console.log(`\x1b[32mEmail sent from ${mailOptions.from} successfully to: ${recipient} (${++emailCount})\x1b[0m`);

                await delayBetweenMessages(3); // 3 emails per second
            } catch (error) {
                console.error(`Error sending email to ${recipient}:`, error);
            }
        }
    } catch (error) {
        console.error('Error:', error);
    }
}

function printHeader() {
    console.log("\x1b[36m_________________________________________________________________");
    console.log("| \x1b[39m      Coders telegram @ceowire                                     \x1b[36m|");
    console.log("| \x1b[52m ______    ____         ____                     __  ______        \x1b[36m|");
    console.log("| \x1b[35m |_____   |__    |     |__        |\\ /|   /__\\  |  | |__           \x1b[36m|");
    console.log("| \x1b[52m ______|  |____  |___  |          |   |  /    \\ |__| |____         \x1b[36m|");
    console.log("| \x1b[35m                                                                   \x1b[36m|");
    console.log("| \x1b[33m    Make sure leads are debounced                                  \x1b[36m|");
    console.log("| \x1b[32m                                      Report any problems to coder \x1b[36m|");
    console.log("\x1b[36m___________________________________________________________________  \x1b[0m");
}

function delayBetweenMessages(messagesPerSecond) {
    const interval = 1000 / messagesPerSecond; // Calculate interval in milliseconds
    return new Promise(resolve => setTimeout(resolve, interval));
}

async function generateImageFromHTML(htmlFilePath, recipient) {
    try {
        const browser = await puppeteer.launch({ executablePath: 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe' });
        const page = await browser.newPage();

        const letterContent = await fs.readFile(htmlFilePath, 'utf8');
        const processedLetterContent = replacePlaceholders(letterContent, [recipient]);

        await page.setContent(processedLetterContent);

        const imageBuffer = await page.screenshot({ type: 'png' });
        await browser.close();

        return 'data:image/png;base64,' + imageBuffer.toString('base64');
    } catch (error) {
        console.error('Error generating image from HTML:', error);
        throw error;
    }
}

sendEmails(); // Start sending emails
