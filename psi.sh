#!/bin/bash
if [ $# -eq 0 ]
then
  echo "Usage (single URL): psi http://example.com/"
  echo "Usage (multiple URLs): psi http://example.com/1 http://example.com/2 http://example.com/3"
  exit 1
fi

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
    curl "https://pagespeed-inslides.herokuapp.com/pagespeed/slides?strategy=mobile&screenshot=true&filterThirdPartyResources=false&locale=en&url=${url}" > "${resultsDir}/PageSpeed-InSlides-Results—${timestamp}—${slug}.html"
  else
    echo "Invalid URL ${url}"
  fi
done
