---
tags:
  - web
  - state
  - token
  - anti-csrf
  - samesite
  - referer
  - double-submit
  - forged-request
  - csrf
---

Prerequisites:

1.  An attacker must construct a page that is hosted on the attacking server, which when clicked on/browsed to, will send a POST request to the victim web server.

2.  The attacker ideally needs knowledge of the target website to to do this because many applications won’t accept the request they receive if it’s not properly constructed or does not contain all the expected data. An attacker ideally needs an account on the target site to know what such a request needs to contain.


Attack Steps:

1.  The user logs into the target website

2.  Target website assigns user a cookie, which is stored in their browser and automatically returned to the application in each subsequent request to identify the user

3.  The attacker tricks the user into clicking on a link to the malicious page hosted on the attacker’s server.

4.  Attacker’s server returns malicious page (described above in prerequisite) to user’s browser

5.  User’s browser interprets malicious page and is instructed to send the maliciously-crafted request to target server (which, because the user is already logged into, is sent through their authenticated session). This causes the data change within the user’s session. This might lead to the user’s email address being changed, so that attacker can then reset their password, other data being changed, XSS code being planted and stored within the user’s profile, which executes every time user either logs in or visits certain page. Can also be used to modify/create new users if administrator account is targeted.


  

CSRF PoC can be generated in burp but does not automatically submit the request when loaded in the browser - within the <form> tag you need to give it a name so that it looks like <form name=CSRF….>

Then add <script>document.CSRF.submit()</script> to the bottom of the page - this will then cause automatic submission.

  

Broad overview to test:

1.  Within the POST request that changes the data, look for any variables or values that could not be easily guessed by an attacker (remember the attacker needs to know what the target application will accept). This should look like a string of random characters.
    
2.  If this isn’t present, try removing the referer request header and see if the request is still accepted - if it is, it’s vulnerable.
    
3.  If the request is declined we need to test whether the application is simply checking for the presence of the value, or checking the value itself. Do this by changing a couple of characters within the value and submitting the request - if this is accepted, it’s vulnerable.
    
4.  This gets slightly more complicated in ASP .NET and when the app is mainly Javascript and JSON-driven
    

  

Testing CSRF in ASP .NET

-   There are usually two phases to testing for CSRF in ASP .NET applications; one important thing that needs consideration in ASP .NET applications is the ViewState, which is the variable beginning in __VIEWSTATE=
    
-   This is basically Microsoft’s way of keep track of users’ session state across different requests, it is basically the ‘state of their view’, such as the buttons they have pressed and any forms they have filled in.
    
-   The ViewState is at minimal base-64 encoded but can be encrypted and in recent versions has the MAC enabled by default (to prevent tampering).
    
-   The other thing that needs consideration is Microsoft’s CSRF token - __EVENTVALIDATION
    

To Test:

1.  As per any test for CSRF, go to a page within the application that allows some form of server-side change, such as changing the user’s details
    
2.  Change some details here and there (such as email address for example) and capture the request in the proxy
    
3.  Since ViewState is the longest parameter and EVENTVALIDATION is in theory the CSRF token, remove both of these from the request body (for some reason it is faster to highlight from the bottom up in Burp); with both these parameters and values completely removed (as well as the referer header), forward the request and see if the change is accepted by the app.
    
4.  The above can be verified by logging out and then back into the application using the new email address, or simply by checking the values of the other values you changed.
    
5.  If these have been accepted, the application is vulnerable.
    

  

If the request has not been accepted, we need to try what I’ll call phase 2 of the test (and this is why we need at least one more user account):

1.  Repeat step 1 and 2 from above but this time, perform the steps within the second user account until the request is captured in a proxy.
    
2.  Copy the ViewState variable and its value from this request into the original request (replacing the original) and see if this is accepted.
    
3.  If this is accepted, the system is vulnerable, if not, then it’s probably reasonably secure. This simulates an attacker who also has access to the same application copying their own ViewState into the attack payload to be sent to a victim.
    

  

Testing CSRF in Oracle

This is the same overall idea as before but the variable that will likely be in use here is _dynsessconf.

So, to check:

1.  Try removing the whole variable and value completely
    
2.  If this is not accepted, try simply changing one character of the value
    
3.  If this is still not accepted then it looks like the application should be sufficiently protected against CSRF.
    

  

As well as the aforementioned parameters specific to the frameworks, always make sure to check each potential CSRF-injectable page for any other unpredictable parameters that are required by the application for the request to be processed.