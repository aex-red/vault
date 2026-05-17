---
tags:
  - web
  - sqli
  - injection
  - union
  - blind
  - time-based
  - error-based
  - bypass
  - sqlmap
  - stacked
  - out-of-band
  - sql
---

----
## Notes
----
White Space Manipulation i.e. carriage return, line feed, tab

'C' Syntax Comments i.e. &id=111/*This is my comment…*/UN/*Can You*/IO/*Find It*/N/**/S/**/E/**/LE/*Another comment to*/CT/*Find. Can you dig*//*it*/*

Hex
Base64
Decimal

**Concatentation**
```
EXEC(‘SEL’ + ‘ECT US’ + ‘ER’)
EXEC(‘SEL’ || ‘ECT US’ || ‘ER’)
```

**Conversion**
```
OR username = char(37) /* 37 is equivalent to the SQL wildcard character, % */
```

**Variables**
```
; declare @myvar nvarchar(80); set @myvar = N’UNI’ + N’ON SEL’ + N’ECT U’ + N’SER’);
EXEC(@myvar)
```


----
## Tools & Exploits
----
**nmap**
```
nmap -sSVC -p [?] -oN nmap_[port].txt 
```

**Tool Name 2**
```
command line string
```

**Cheat Sheet** 
```
' OR 1=1'

```
----
## References
----
http://put-links-here.com



