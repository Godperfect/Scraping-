const { Builder, By, until } = require('selenium-webdriver');
const chrome = require('selenium-webdriver/chrome');
const fs = require('fs');

async function scrapeGenSparkNews() {
    console.log("Starting the scraper...");
    
    // Set up Chrome options
    const options = new chrome.Options();
    // Comment out headless mode for troubleshooting
    // options.addArguments('--headless');
    options.addArguments('--disable-gpu');
    options.addArguments('--no-sandbox');
    options.addArguments('--disable-dev-shm-usage');
    options.addArguments('--window-size=1920,1080');
    // Disable web security to address potential CORS issues
    options.addArguments('--disable-web-security');
    // Enable JavaScript
    options.setUserPreferences({ 'javascript.enabled': true });
    
    // Initialize the WebDriver
    const driver = await new Builder()
        .forBrowser('chrome')
        .setChromeOptions(options)
        .build();
    
    try {
        // Navigate to the URL
        console.log("Navigating to GenSpark news page...");
        await driver.get('https://www.genspark.ai/news?channel=technology');
        
        // First wait for the page to load
        console.log("Waiting for page to load completely...");
        await driver.sleep(5000);
        
        // Try a different selector approach
        console.log("Looking for news articles...");
        
        // Wait for any element with class containing "flow_item"
        await driver.wait(until.elementLocated(By.css('div[data-v-ea737bf6].flow_item_wrapper')), 30000);
        
        console.log("Page loaded successfully");
        
        // Function to scroll down the page
        const scrollDown = async () => {
            await driver.executeScript('window.scrollBy(0, 800);');
            await driver.sleep(1000);
        };
        
        // Collect data for 10 items - we'll need to scroll to find more items
        const newsData = [];
        let newsItems = [];
        let scrollAttempts = 0;
        const maxScrollAttempts = 15;  // Maximum number of scrolling attempts
        
        console.log("Starting to scroll and collect news items...");
        
        while (newsItems.length < 10 && scrollAttempts < maxScrollAttempts) {
            // Get current news items
            const currentItems = await driver.findElements(By.css('div[data-v-ea737bf6].flow_item_wrapper'));
            
            if (currentItems.length > newsItems.length) {
                newsItems = currentItems;
                console.log(`Found ${newsItems.length} news items so far`);
            }
            
            if (newsItems.length < 10) {
                console.log(`Scrolling down to load more content (attempt ${scrollAttempts + 1}/${maxScrollAttempts})`);
                await scrollDown();
                scrollAttempts++;
            } else {
                break;
            }
        }
        
        if (newsItems.length === 0) {
            console.log("No items found with primary selector. Trying alternative selector...");
            // Try an alternative selector based on the provided HTML structure
            newsItems = await driver.findElements(By.css('div[id^="item-"]'));
            
            if (newsItems.length === 0) {
                throw new Error("Could not find any news items on the page");
            }
        }
        
        console.log(`Total news items found: ${newsItems.length}`);
        console.log(`Fetching data for up to 10 items...`);
        
        // Process up to 10 items
        for (let i = 0; i < Math.min(10, newsItems.length); i++) {
            const item = newsItems[i];
            
            try {
                // Extract ID from the element's id attribute (removing the 'item-' prefix)
                const id = await item.getAttribute('id');
                const cleanId = id ? id.replace('item-', '') : `article-${i+1}`;
                
                // Extract title - handling possible errors
                let title = '';
                try {
                    title = await item.findElement(By.css('.title')).getText();
                } catch (err) {
                    console.log(`Error getting title for item ${i+1}: ${err.message}`);
                }
                
                // Extract summary - handling possible errors
                let summary = '';
                try {
                    summary = await item.findElement(By.css('.summary')).getText();
                } catch (err) {
                    console.log(`Error getting summary for item ${i+1}: ${err.message}`);
                }
                
                // Extract image URL - handling possible errors
                let imageUrl = '';
                try {
                    const imageElement = await item.findElement(By.css('.image img'));
                    imageUrl = await imageElement.getAttribute('src');
                } catch (err) {
                    console.log(`Error getting image for item ${i+1}: ${err.message}`);
                }
                
                // Extract source name - handling possible errors
                let sourceName = '';
                try {
                    sourceName = await item.findElement(By.css('.source-name')).getText();
                } catch (err) {
                    console.log(`Error getting source for item ${i+1}: ${err.message}`);
                }
                
                // Extract published time - handling possible errors
                let publishedTime = '';
                try {
                    publishedTime = await item.findElement(By.css('.published-time')).getText();
                } catch (err) {
                    console.log(`Error getting published time for item ${i+1}: ${err.message}`);
                }
                
                // Add to our collection
                newsData.push({
                    id: cleanId,
                    title,
                    summary,
                    image: imageUrl,
                    source: sourceName,
                    publishedTime
                });
                
                console.log(`Successfully extracted data for article ${i+1}: ${title}`);
            } catch (itemError) {
                console.error(`Error processing item ${i+1}:`, itemError);
            }
        }
        
        // Display the results
        console.log(`\nSuccessfully collected ${newsData.length} Technology News Articles from GenSpark`);
        
        // Save data to news.json file
        fs.writeFileSync('news.json', JSON.stringify(newsData, null, 2), 'utf8');
        console.log("Data saved to news.json");
        
        return newsData;
        
    } catch (error) {
        console.error('An error occurred during scraping:', error);
        
        // Print the current page source for debugging
        console.log("\nAttempting to get page source for debugging:");
        try {
            const pageSource = await driver.getPageSource();
            console.log("Page Title: ", await driver.getTitle());
            console.log("Current URL: ", await driver.getCurrentUrl());
            console.log("First 500 characters of page source:");
            console.log(pageSource.substring(0, 500) + "...");
        } catch (e) {
            console.error("Failed to get page source:", e);
        }
    } finally {
        // Always close the browser
        await driver.quit();
        console.log("Scraper finished. Browser closed.");
    }
}

// Run the scraper
scrapeGenSparkNews(); 
