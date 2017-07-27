# PageSpeed InSlides

**✏️ Description:**

The *PageSpeed InSlides* tool, which—as the name suggests
(not a typo, think "PageSpeed, but in slides") —lifts the output from the
[PageSpeed Insights API](https://developers.google.com/speed/docs/insights/v2/reference/pagespeedapi/runpagespeed)
and creates an interactive [HTML5 slide](http://tomayac.github.io/html5-slides/template.html#1)
deck for you, on the fly. The target audience is technical, for example,
front-end engineers and webmasters, this is not meant as an introductory pitch deck.

*Please note: this is not an official Google product.*

**🖥 Screenshots:**

Input form with various options:

![Input Form](https://github.com/google/pagespeed-inslides/blob/master/docs/0.png)

Slide examples:

![Title Slide](https://github.com/google/pagespeed-inslides/blob/master/docs/1.png)

![Screenshot Slide](https://github.com/google/pagespeed-inslides/blob/master/docs/2.png)

![Waterfall Diagram Slide](https://github.com/google/pagespeed-inslides/blob/master/docs/3.png)

![Optimization Slide](https://github.com/google/pagespeed-inslides/blob/master/docs/4.png)

**📚 Instruction Manual:**

The features of the PageSpeed InSlides tool are described in the [manual](https://github.com/google/pagespeed-inslides/raw/master/docs/instructions.pdf) (PDF).

**🔥 Demo:**

Navigate to this [demo deck](https://google.github.io/pagespeed-inslides/),
then navigate in the slides with the arrow keys ⬅️ ➡️).
Please note that this demo is not generated live, but an archived older version.

**⚙️ Setup:**

Get an API key and activate the necessary APIs in the Google Developer Console:

* PageSpeed Insights API ([instructions](https://developers.google.com/speed/docs/insights/v2/first-app#APIKey))
* URL Testing Tools API ([instructions](https://developers.google.com/webmaster-tools/search-console-api/v1/configure))

Then rename the ```dot_env``` file in the repository to ```.env``` and paste the API key in.

Now, install the package. Assuming you are within the directory `/pagespeed-inslides`

```
npm install
```

**🔨 Usage:**

Open the form at [localhost:3000/](http://localhost:3000) using 

```
node index.js 
```

and simply enter a URL, optionally change any of the other fields.

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
