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
    curl "http://localhost:3000/pagespeed/slides?strategy=mobile&screenshot=true&filterThirdPartyResources=false&locale=en&url=${url}" > "${resultsDir}/PageSpeed-InSlides-Results—mobile—${timestamp}—${slug}.html"
  else
    echo "Invalid URL ${url}"
  fi
done
