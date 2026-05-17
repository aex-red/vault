---
tags:
  - web
  - origin
  - access-control
  - preflight
  - credentials
  - same-origin
  - wildcard
  - misconfiguration
  - cors
---

----
## Summary
----
![](CORS.png)

> For security reasons, browsers restrict cross-origin HTTP requests initiated from within scripts. For example, `[XMLHttpRequest](https://developer.mozilla.org/en-US/docs/Web/API/XMLHttpRequest)` and [Fetch](https://developer.mozilla.org/en-US/docs/Web/API/Fetch_API) follow the [same-origin policy](https://developer.mozilla.org/en-US/docs/Web/Security/Same-origin_policy). So, a web application using `[XMLHttpRequest](https://developer.mozilla.org/en-US/docs/Web/API/XMLHttpRequest)` or [Fetch](https://developer.mozilla.org/en-US/docs/Web/API/Fetch_API) _could only_ make HTTP requests to its own domain. To improve web applications, developers asked browser vendors to allow cross-domain requests.

To get around this, the concept of **CORS** (Cross-Origin Resource Sharing) was introduced. This allows requests to be made from one domain to another.

A simplified explanation of CORS (for GET requests) is that the resource owner (the guy you’re asking for stuff) can add the header `Access-Control-Allow-Origin: google.com` to their API responses if they wish to allow an AJAX request at google.com to pass. They could also make it `Access-Control-Allow-Origin: *` to allow requests from all domains. That’s CORS in a nutshell. (It’s a bit more complicated than that, especially when you’re using a different HTTP method.)

With CORS, effectively the user's browser becomes the access control mechanism that decides whether or not to let scripts on Domain A read content on Domain B, based on whether the returned value of `Access-Control-Allow-Origin` matches value the `Origin` header.

When misconfigured this can pave the way for all sorts of interesting exfiltration, CSRF and even internal network scanning attacks (through badly configured Intranet sites for example). The browser effectively acts as a proxy between the attacker controlled site and the target site.

----
## Terminology 
----
**Same Origin Policy (SOP)**
	Restricts how a document or script loaded by one origin can interact with a resource from another origin. Two URLs have the _same origin_ if the protocol, port and host are the same for both.

**Inherited Origin**
	Scripts executed from pages with an `about:blank` or `javascript:` URL inherit the origin of the document containing that URL, since these types of URLs do not contain information about an origin server.

**Preflight Request**
	 An initial `OPTIONS` request using the three headers  `Access-Control-Request-Method`, `Access-Control-Request-Headers` and `Origin` that checks to see if the CORS protocol is understood and the server is aware using specific methods and headers.

----
## Headers
----
`Access-Control-Allow-Origin`
	Indicates whether the response can be shared with requesting code from the given origin.
	
`Access-Control-Allow-Credentials`
	Tells browsers whether to expose the response to the frontend JavaScript code when the request's credentials mode (`Request.credentials`) is `include`.

`Access-Control-Expose-Headers`
	Allows a server to indicate which response headers should be made available to scripts running in the browser, in response to a cross-origin request.

`Access-Control-Max-Age`
	Indicates how long the results of a preflight request (that is the information contained in the `Access-Control-Allow-Methods` and `Access-Control-Allow-Headers` headers) can be cached.

`Access-Control-Allow-Methods`
	Specifies one or more methods allowed when accessing a resource in response to a preflight request.

`Access-Control-Allow-Headers`
	Used in response to a preflight request which includes the `Access-Control-Request-Headers` to indicate which HTTP headers can be used during the actual request.

----
## Issues and Exploitation
----
https://cors-anywhere.herokuapp.com/corsdemo
https://github.com/shalvah/cors-escape
https://www.geekboy.ninja/blog/exploiting-misconfigured-cors-cross-origin-resource-sharing/
https://0xn3va.gitbook.io/cheat-sheets/web-application/cors-misconfiguration

https://portswigger.net/research/exploiting-cors-misconfigurations-for-bitcoins-and-bounties

----
## Prevention
----
-   To prevent cross-origin writes, check an unguessable CSRF token in the request. You must prevent cross-origin reads of pages that require this token.
-   To prevent cross-origin reads of a resource, ensure that it is not embeddable. It is often necessary to prevent embedding because embedding a resource always leaks some information about it.
-   To prevent cross-origin embeds, ensure that your resource cannot be interpreted as one of the embeddable formats listed above. Browsers may not respect the `Content-Type` header. For example, if you point a `<script>` tag at an HTML document, the browser will try to parse the HTML as JavaScript. When your resource is not an entry point to your site, you can also use a CSRF token to prevent embedding.

----
## References
----
https://portswigger.net/web-security/cors

https://thesecurityvault.com/understanding-cors-and-sop-bypass-techniques/

https://developer.mozilla.org/en-US/docs/Web/HTTP/CORS