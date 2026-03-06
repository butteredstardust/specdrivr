🔒 Fix Cross-Site Scripting (XSS) in InlineConstitutionEditor

🎯 **What:**
Fixed an XSS vulnerability in the `InlineConstitutionEditor` component. The `renderMarkdown` function was passing generated HTML directly to `dangerouslySetInnerHTML` without any sanitization.

⚠️ **Risk:**
If left unfixed, any user capable of setting the constitution could inject malicious scripts. This script could execute in the context of other users viewing the project constitution, potentially stealing tokens, executing actions on their behalf, or stealing sensitive data. This presents a high risk due to the collaborative nature of the platform.

🛡️ **Solution:**
- Added `isomorphic-dompurify` to the project to provide robust, cross-environment HTML sanitization.
- Wrapped the output of `renderMarkdown` with `DOMPurify.sanitize()` before passing it into `dangerouslySetInnerHTML`.
- Added unit tests to explicitly verify that potentially dangerous inputs (e.g. `<script>` tags) are properly stripped out.
