# Eternal cursor of http dominance

This Legendary +10 Cursor library grants to the user an unlimited feeling of power and accomplishment as soon as the swing effect starts

A direct consequence of using this skin for your cursor is the permanent modification of the following attributes:

- +380% Clicking precision
- +280% Mouse ferocity
- +120% Left click magic power
- +380% Carpal tunnel chance reduction
- +380% Wrist pain reduction
- +999% User random swing chance

# How to achieve the same level of greatness in your webpage

``` javascript
npm i legendary-cursor
```

And to activate it in your webpage:

``` javascript
import LegendaryCursor from "./src/index";

window.addEventListener("load", () => {
    LegendaryCursor.init();
});
```

There's a few options you can change with the following arguments:

``` javascript
import LegendaryCursor from "./src/index";

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
    });

});
```