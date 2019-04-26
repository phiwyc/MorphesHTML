![logo](https://raw.githubusercontent.com/phiwyc/MorphesHTML/master/morphes-logo.png)
# MorphesHTML
A new grammer for HTML.
This is a branch of Morphes. 
Morphes is a group of techology for front-end dev. It would contain: MorphesHTML(MTML) and MorphesCSS(MCSS). Morphes is still under development.

Don't like the grammer of HTML? You could try MTML...

The old HTML would be like:
```HTML
<div>
  <p class="word">This is a word</p>
</div>
<div class="anotherDiv hello">
  <img class="picture image" width="100">
</div>
```

But MTML would be like:
```
div
  p:word
    'This is a word'
div:anotherDiv hello
  img:picture image
    (width: 100)
```

That's all. No more tags, only spaces and enters.

MTML Code Extension is now available in VSCode Extension, just search MTML in VSCode Extension and you will find it.

# Usage

## Warning: this project is still under development, so you should on your own risk if you use it now.

Download this project, code your page in src folder. Your MTML code file's extesion name should be mtml, for examble, index.mtml.

After your coding, run
```
node index.js
```
It will start compiling, and generate your file in dist folder. All your mtml file would be compiled to html file.
