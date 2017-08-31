var request = require('request');
var cheerio = require('cheerio');
var URL = require('url-parse');

var SEARCH_WORD = process.argv[3];
var START_URL = process.argv[2];

console.log("Visiting page " + START_URL);
console.log("Finding: " + SEARCH_WORD);

var MAX_PAGES_TO_VISIT = 10;

var pagesToVisit = [];
var numPagesVisited = 0;
var pagesVisited = {};
var url = new URL(START_URL);
var baseUrl = url.protocol + "//" + url.hostname;
var foundWords = 0;

pagesToVisit.push({
	url: START_URL,
	depth: 0
	});
	
crawl();

function crawl(){
	/*
	if(numPagesVisited >= MAX_PAGES_TO_VISIT) {
		console.log("Reached max limit of number of pages to visit.");
		return;
	}*/
	
	if(pagesToVisit.length == 0){
		console.log("Crawled " + numPagesVisited + " pages. Found " + foundWords + " pages with the term " + SEARCH_WORD);
		return;
	}
	
	var nextPage = pagesToVisit.pop();
	
	if(nextPage){
		
		var url = nextPage.url;
		var level = nextPage.depth;
		
		if (url in pagesVisited) {
			// We've already visited this page, so repeat the crawl
			crawl();
		} else {
			// New page we haven't visited
			visitPage(url, crawl, level);
		}
	}
}

function visitPage(url, callback, level){

	// Add page to our set
	pagesVisited[url] = true;
	numPagesVisited++;

	request(url, function (error, response, body) {
		//console.log('error:', error); // Print the error if one occurred
		//console.log('statusCode:', response && response.statusCode); // Print the response status code if a response was received

		//console.log("trying: " + url);
		//console.log('.');
		if(response.statusCode !== 200) {
			callback();
			return;
		}
		
		var $ = cheerio.load(body);
		
		var isWordFound = searchForWord($, SEARCH_WORD);
		if(isWordFound) {
			console.log(url + " => " + SEARCH_WORD + " at level " + level);
			foundWords++;
		}
		collectInternalLinks($, level);
		//callback();
	});
}

function searchForWord($, word) {
	var bodyText = $('html > body').text();
	console.log(bodyText);
	if(bodyText.toLowerCase().indexOf(word.toLowerCase()) !== -1) {
		foundWords++;
		return true;
	}
	return false;
}



function collectInternalLinks($, level) {
    var relativeLinks = $("a[href^='/']");
    //console.log("Found " + relativeLinks.length + " relative links on page");
	if(level < 2){
		relativeLinks.each(function() {
			var link = $(this).attr('href');
			if(link[1] == '/'){
				pagesToVisit.push({
					url: 'http:' + $(this).attr('href'),
					depth: level + 1
				});
			}
			else{
				pagesToVisit.push({
					url: baseUrl + $(this).attr('href'),
					depth: level + 1
				});
			}
		});
	}
}

