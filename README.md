# PageSpeed InSlides
**✏️ Description:**
The *PageSpeed InSlides* tool, which—as the name suggests
(not a typo, think "PageSpeed, but in slides") —lifts the output from the
[PageSpeed Insights API](https://developers.google.com/speed/docs/insights/v2/reference/pagespeedapi/runpagespeed)
and creates an interactive [HTML5 slide](http://tomayac.github.io/html5-slides/template.html#1)
deck for you, on the fly. The target audience is technical, for example,
front-end engineers and webmasters, this is not meant as an introductory pitch deck.

*Please note: this is not an official Google product.*

**🔥 Demo:**
Navigate to [https://pagespeed-inslides.firebaseapp.com/](https://pagespeed-inslides.firebaseapp.com/#1),
then navigate in the slides with the arrow keys ⬅️ ➡️).
Please note that this demo is not generated live, but an archived older version.

**🔨 Usage:**
Open the form at [localhost:3000/](http://localhost:3000) and simply enter a URL,
optionally change any of the other fields.

As an alternative, the user interface is also accessible in form of a hackable URL 😎.
Just replace the highlighted parts as explained below:
[http://localhost:3000/slides?screenshot=true&locale=en&strategy=mobile&url=https://blog.google/](http://localhost:3000/slides?screenshot=true&locale=en&strategy=mobile&url=https://blog.google/)
*   &locale=en → Any of the language codes [supported](https://developers.google.com/speed/docs/insights/languages) by the API.
*   &strategy=mobile → Either "desktop" or "mobile".
*   &url=[https://blog.google](https://blog.google/)/ → Any URL that is publicly available.
*   &screenshot=true → Whether or not to include a screenshot, either "true" or "false".
*   &filterThirdPartyResources=false → Whether or not to filter out many third-party resources, either "true" or "false".
*   &mobileFriendlyTest=false → Whether or not to run a [mobile-friendly test](https://developers.google.com/webmaster-tools/search-console-api/), either "true" or "false".

**📧 Contact:**
Thomas Steiner ([tomac@google.com](mailto:tomac@google.com))

**📄 License:**
```plaintext
Copyright 2017 Google

Licensed under the Apache License, Version 2.0 (the "License");
you may not use this file except in compliance with the License.
You may obtain a copy of the License at
http://www.apache.org/licenses/LICENSE-2.0

Unless required by applicable law or agreed to in writing, software
distributed under the License is distributed on an "AS IS" BASIS,
WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
See the License for the specific language governing permissions and
limitations under the License.
```
