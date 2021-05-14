let puppeteer = require("puppeteer");
let cheerio = require("cheerio");
let request = require("request");
let fs = require("fs");


// TODO ADD utility method to fetch email and pass from env vars
// FROM_EMAIL:
// PASSSWROD:

// updating default.json with Latest Notices .
getNoticeUpdate()


async function mailToSubscriber(){
    // function to send new notices to 
    // subscribers of the mailing list.
    let browser = await puppeteer.launch({
        headless: false,
        defaultViewport: null,
        args: ["--start-maximized"],
    });
    let pages = await browser.pages();
    page = pages[0]
    
    // login to gmail.
    await LoginToGmail();

    // compose mail.
    await sendEmail();
    
}

async function sendEmail() {
    let compose_url = "https://mail.google.com/mail/u/0/#inbox?compose=new";
    await page.goto(compose_url);

    // enter email of recipient in the "to" section.
    await page.waitForSelector('textarea[name="to"]', { visible: true });
    await page.type('textarea[name="to"]', "goyal.amanrocks@gmail.com");
    await page.keyboard.press("Enter");

    // press tab twice to get to message body.
    await page.keyboard.press("Tab");
    await page.keyboard.press("Tab");


    // goto text area and enter text to be sent.
    let data = readFile();
    let text = JsonToText(data);
    await page.type("div[id=':9a']", text);
    // press control enter to send email
    await page.keyboard.down("Control");
    await page.keyboard.press("Enter");
    await page.keyboard.up("Control");
}

async function LoginToGmail() {
    let gmail_url = "https://www.gmail.com";
    await page.goto(gmail_url);
    await page.type("input[type='email']", FROM_EMAIL);
    await page.keyboard.press("Enter");
    await page.waitForNavigation();
    await page.waitForSelector("input[name='password']", { visible: true });
    await page.type("input[name='password']", PASSSWROD);
    await page.keyboard.press("Enter");
    await page.waitForNavigation();
}

async function getNoticeUpdate(){
    let baseUrl = "http://www.ipu.ac.in";
    let url = "http://www.ipu.ac.in/notices.php";
    
     request(url, async function (err, res, body){
        if(err){
            return;
        }

        let $ = cheerio.load(body);
        let trTags = []
        for(let i=1; i<=10; i++){
            let nthTr = $(`body > div.table-box > table > tbody:nth-child(2) > tr:nth-child(${i})`)
            trTags.push(nthTr);
        }


        let links = [];
        for(let i=0; i<trTags.length; i++){
            let tds  = $(trTags[i]).find('td');
            
            let td_a = tds[0];
            let td_date = tds[1];

            let href = baseUrl+ $(td_a).find('a').attr('href');
            let NoticeText = $(td_a).text().trim(); 
            let Date = $(td_date).text().trim();;


            links.push({NoticeText, Date, href});
        }
        writeToFile(JSON.stringify(links));
        await mailToSubscriber();

    })

async function findNewNotice(LatestData){
    // DataObj is obj to newly fetched info.
    
    let oldData = readFile();

    // contains new notices, that are not in old data.
    let newNotices = {};
    
    // for all notices in latestData, if notice is not present in 
    // old data save it in newNotices.
    for(let key in LatestData){
        if(!oldData.hasOwnProperty(key)){
            newNotices[key] = LatestData[key];
        }
    }
    console.log("Found "+ Object.keys(newNotices).length+ " Notices");
    writeToFile(JSON.stringify(LatestData));
    return newNotices;
}
}
function writeToFile(data, file_name='default.json'){
    fs.writeFileSync(file_name, data, (err)=>{
        if(err){
            throw err;
        }
        console.log("Done!.")
    })
}
function readFile(file_name='default.json'){
    let fileData = fs.readFileSync(file_name);
    return JSON.parse(fileData);
}

function JsonToText(JsonObj){
    // converts JSON data in JsonObj
    // to text format, so that it can be 
    // attached to mail or any input filed.

    let text = "";
    for(let i=0; i<JsonObj.length; i++){
        let notice = JsonObj[i];

        // adding notice text to text.
        text += "Notice: " + notice['NoticeText']+".\n";
        
        // adding date.
        text += "Date: "+ notice["Date"]+"\n";
        
        // adding notice url.
        text += "Link: "+ notice['href']+"\n";
        
        // adding a new line to easily differentiate b/w notices.
        text += "\n";
    }
    console.log(text);
    return text;
}

async function waitClickNavigate(selector) {
    await page.waitForSelector(selector, { visible: true })
    await Promise.all([page.click(selector), page.waitForNavigation()]);
}