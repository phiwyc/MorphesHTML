# MorphesHTML
A new grammer for HTML

Don't like the grammer of HTML? You could try MorphesHTML...

The old HTML would be like:
```HTML
<div>
  <p class="word">This is a word</p>
</div>
<div class="anotherDiv hello">
  <img class="picture image" width="100">
</div>
```

But MorphesHTML would be like:
```
div
  p
    (class: word)
    'This is a word'
div
  (class: anotherDiv hello)
  img
    (class: picture image)
    (width: 100)
```

That's all. No more tags, only spaces and enters.

MorphesHTML Code Extension is now available in VSCode Extension, just search MTML in VSCode Extension and you will see it.
