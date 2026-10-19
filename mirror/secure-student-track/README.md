# Offline mirror: SSB PU College attendance site

Source: https://secure-student-track.lovable.app — mirrored with HTTrack 3.49.5
(HTTPS is supported by default in this build; no extra package needed).

## Pages

| Page | Open |
| --- | --- |
| Faculty Dashboard (lecturer) | `secure-student-track.lovable.app/lecturer.html` |
| Principal login / dashboard | `secure-student-track.lovable.app/principal.html` |

## Commands

```sh
sudo apt-get install -y httrack
httrack "https://secure-student-track.lovable.app/lecturer" -O mirror/secure-student-track \
  "+*.secure-student-track.lovable.app/*" "-*blog*" -r6
httrack "https://secure-student-track.lovable.app/principal" -O mirror/secure-student-track \
  "+*.secure-student-track.lovable.app/*" "-*blog*" -r6 --update
```

## Notes

- Any URL containing `blog` is excluded; no blog files are in this copy.
- The site is a JavaScript app. The copy holds the page shell, styles and scripts
  (including `principal-*.js`, `PrincipalFeeOverview-*.js`, `PrincipalStaffAttendance-*.js`).
  Signing in and all records (attendance, fees, staff) still come from the live backend,
  so the login form only works while online.
