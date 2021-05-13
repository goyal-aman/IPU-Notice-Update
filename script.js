let puppeteer = require("puppeteer");
let cheerio = require("cheerio");
let request = require("request");
let fs = require("fs");

// updating default.json with Latest Notices .
getNoticeUpdate();

async function getNoticeUpdate(){
    let baseUrl = "http://www.ipu.ac.in";
    let url = "http://www.ipu.ac.in/notices.php";
    request(url, (err, res, body)=>{
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
    })
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