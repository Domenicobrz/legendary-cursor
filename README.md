# Eternal cursor of http dominance

<img src="https://github.com/Domenicobrz/legendary-cursor/blob/master/screenshots/s1.jpg" width="100%">

This Legendary +10 Cursor library grants to the user an unlimited feeling of power and accomplishment as soon as the swing effect starts

A direct consequence of using this skin for your cursor is the permanent modification of the following attributes:

- [x] **+380%** Clicking precision
- [x] **+280%** Mouse ferocity
- [x] **+120%** Left click magic power
- [x] **+380%** Carpal tunnel chance reduction
- [x] **+380%** Wrist pain reduction
- [x] **+999%** User random swing chance

# How to get it

``` javascript
npm i legendary-cursor
```

And to activate it in your webpage:

``` javascript
import LegendaryCursor from "legendary-cursor";

window.addEventListener("load", () => {
    LegendaryCursor.init();
});
```

There are a few options you can change with the following arguments:

``` javascript
import LegendaryCursor from "legendary-cursor";

window.addEventListener("load", () => {

    LegendaryCursor.init({
        lineSize:         0.15,
        opacityDecrement: 0.55,
        speedExpFactor:   0.8,
        lineExpFactor:    0.6,
        sparklesCount:    65,
        maxOpacity:       0.99,  // should be a number between [0 ... 1]
        // texture1:         "http://path_to_texture",      // texture displayed on mouse hover
        // texture2:         "http://path_to_texture",      // texture displayed on mouse click
        // texture3:         "http://path_to_texture",      // texture displayed on sparkles
    });

});
```

# Demo

[Try it here!](https://domenicobrz.github.io/)

# Credits

Took inspiration from [this awesome article](https://tympanus.net/codrops/2019/09/24/crafting-stylised-mouse-trails-with-ogl/) made by [Nathan Gordon](https://github.com/gordonnl)