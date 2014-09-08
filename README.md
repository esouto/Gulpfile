#Gulpfile
===

Gulpfile and Packages


Available Tasks

gulp sass --app shopflow  :  compile all .scss files inside --app option-folder inside /css, available options [shopflow, checkout, myaccount]
gulp less --app shopflow  :  compile all .less as above
gulp styles --app shopflow  :  run sass & less tasks and concatenate all files into /local/styles.css
gulp webserver  :  open a web-server under localhost:8080 that will auto reload all changes
gulp browser-sync --app shopflow  :  open a web-server under localhost:3000 with browser sync services
gulp scripts --app shopflow  :  compile all scripts inside /js folder based on combiner.config
gulp templates --app shopflow  :  compile all templates inside /templates folder based on combiner.config
gulp watch --app shopflow  :  watch all [styles, scripts, templates]
gulp build-dist --app shopflow  :  build all the necesary files for distribution inside /dist
gulp build-local --app shopflow  :  build all for local development
gulp index-local --app shopflow  :  generate a new index_local.ssp inside /dist folder for uploda and work locally
gulp customs --app shopflow  :  compile all scripts inside /js folder to work locally
gulp clean  :  remove all inside /dist folder
