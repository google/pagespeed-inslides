#  Copyright 2017 Google Inc. All rights reserved.
#
#  Licensed under the Apache License, Version 2.0 (the "License");
#  you may not use this file except in compliance with the License.
#  You may obtain a copy of the License at
#
#      http://www.apache.org/licenses/LICENSE-2.0
#
#  Unless required by applicable law or agreed to in writing, software
#  distributed under the License is distributed on an "AS IS" BASIS,
#  WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
#  See the License for the specific language governing permissions and
#  limitations under the License.

#!/bin/bash
if [ $# -eq 0 ]
then
  echo "usage: psi
    -u,--urls                           http://example.org OR http://example.org/1 http://example.org/2 ...
    [-s,--strategy                      mobile OR desktop]
    [-ss,--screenshot                   true OR false]
    [-f,--filter-third-party-resources  true OR false]
    [-l,--locale                        en OR any of https://developers.google.com/speed/docs/insights/languages]"
  exit 1
fi

#
# while [[ $# -gt 1 ]]
# do
# key="$1"
#
# case $key in
#     -e|--extension)
#     EXTENSION="$2"
#     shift # past argument
#     ;;
#     -s|--searchpath)
#     SEARCHPATH="$2"
#     shift # past argument
#     ;;
#     -l|--lib)
#     LIBPATH="$2"
#     shift # past argument
#     ;;
#     --default)
#     DEFAULT=YES
#     ;;
#     *)
#             # unknown option
#     ;;
# esac
# shift # past argument or value
# done
#
#

function slugify()
{
  # From https://gist.github.com/oneohthree/f528c7ae1e701ad990e6
  echo "$1" | iconv -t ascii//TRANSLIT | sed -E s/[^a-zA-Z0-9]+/-/g | sed -E s/^-+\|-+$//g | tr A-Z a-z
}

resultsDir="pagespeed-inslides-results"
if [ ! -d "$resultsDir" ]
then
  mkdir "$resultsDir"
fi

urlRegEx="(https?)://[-A-Za-z0-9\+&@#/%?=~_|!:,.;]*[-A-Za-z0-9\+&@#/%=~_|]"
for url in "$@"
do
  if [[ $url =~ $urlRegEx ]]
  then
    echo "Processing URL ${url}"
    slug=$(slugify $url)
    timestamp=`date +%Y-%m-%d—%H-%M-%S`
    curl "http://localhost:3000/slides?strategy=desktop&screenshot=true&filterThirdPartyResources=false&locale=en&url=${url}" > "${resultsDir}/PageSpeed-InSlides-Results—desktop—${timestamp}—${slug}.html"
  else
    echo "Invalid URL ${url}"
  fi
done
