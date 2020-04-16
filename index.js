// Register a FetchEvent listener that sends a custom response for the given request
addEventListener('fetch', event => {
  event.respondWith(handleRequest(event.request))
})

// Define and set variables variantsURL and cookieName
const variantsURL = 'https://cfw-takehome.developers.workers.dev/api/variants'
const cookieName = 'response_variants'

/**
* Return a custom Response object
* @param {Request} request
*/
async function handleRequest(request) {
  // Customize HTML for variant 1
  const rewriter1 = new HTMLRewriter()
      .on('h1#title', new TextRewriter('Variant A'))
      .on('p#description', new TextRewriter("Hello, my name is Jennifer Powell. Please feel free to checkout my projects below"))
      .on('a#url', new AttributeRewriter('href', 'http://jennifer-powell.io'))
      .on('a#url', new TextRewriter('My Portfolio'));

  // Customize HTML for variant 2
  const rewriter2 = new HTMLRewriter()
      .on('h1#title', new TextRewriter('Variant B'))
      .on('p#description', new TextRewriter("Hello, my name is Jennifer Powell and I'm a developer."))
      .on('a#url', new AttributeRewriter('href', 'https://www.linkedin.com/in/jenniferrpowell/'))
      .on('a#url', new TextRewriter('My Linkedin'));

  // Make a fetch request to request the URLs from the API
  let variants = await fetchJson(variantsURL)
  // Set initial cookie variant_pick value to be -1
  let variant_pick = -1
  // Define function to retrieve the value of the cookie with variant_pick as header
  // cookies value should be either be 0, 1, or null
  const cookies = await getCookie(request, cookieName)
  // If cookies returns a value than set variant_pick to the cookies value else set variant_pick to a random value 0 or 1
  if (cookies) {
      variant_pick = cookies
  } else {
      // Randomly pick a variant (allows for more than 2)
      variant_pick = Math.floor(Math.random() * variants.variants.length)
  }
  // Make a fetch request to request the HTML contents from the variant URL
  let response = await fetch(variants.variants[variant_pick])
  // Set response to include the HTML body and response object
  response = new Response(response.body, response)
  // Set the response header have 'response_variants'= 0 or 1 based on if there were cookies or based on the random value set
  response.headers.set('Set-Cookie', `${cookieName}=${variant_pick}; path=/`)
  // If the variant_pick is 0 than return the page with the `rewriter1` transformation 
  if (variant_pick === 0) {
      return rewriter1.transform(response);
  }
  // If the variant_pick is 1 (or if someone changes the value of the cookie manually, then return the rewriter1 object 
  return rewriter2.transform(response);
}

/*
* Class to rewrite attributes within HTML elements
* Modified from https://developers.cloudflare.com/workers/templates/pages/rewrite_links_html/
*/
class AttributeRewriter {
  constructor(attributeName, attributeValue) {
      this.attributeName = attributeName;
      this.attributeValue = attributeValue;
  }
  element(element) {
      element.setAttribute(this.attributeName, this.attributeValue);
  }
}
/**
* Class to rewrite text within a HTML tag
*/
class TextRewriter {
  constructor(newText) {
      this.newText = newText;
  }
  element(element) {
      element.setInnerContent(this.newText);
  }
}

/**
* Make a fetch request to a URL and parse the response as JSON
* @param {string} url to fetch and parse
*/
async function fetchJson(url) {
  const response = await fetch(url)
  return response.json()
}

/**
* Grabs the cookie with name from the request headers
* Taken from example: https://developers.cloudflare.com/workers/templates/pages/cookie_extract/
* @param {Request} request incoming Request
* @param {string} name of the cookie to grab
*/
function getCookie(request, name) {
  // Set result to have value of null 
  let result = null
  // Retrieve all cookies and set the string result to cookieString
  let cookieString = request.headers.get('Cookie')
  // If cookieString has a value
  if (cookieString) {
      // Take cookieString, Define an array of cookies 
      let cookies = cookieString.split(';')
      // Interate through the cookies array 
      cookies.forEach(cookie => {
          // Set the cookieName to be the value of the string before the '=' sign
          let cookieName = cookie.split('=')[0].trim()
          // If the cookieName matches 'response_variants', which was passed to the function as 'name'
          if (cookieName === name) {
              // Define cookieVal to be the value of the string after the '=' sign
              let cookieVal = cookie.split('=')[1]
              // Update the result to be the cookieVal of either 1 or 0
              result = cookieVal
          }
      })
  }
  // return the result
  return result
}