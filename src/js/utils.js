import * as THREE from "three";

let Utils = { }

Utils.smoothstep = function(t) {
    return t * t * (3 - 2 * t);
}

let onceMemory = { }
Utils.once = function(tag) {
    if(!onceMemory[tag]) {
        onceMemory[tag] = true;
        return true;
    }

    return false;
}

Utils.parseIncludes = function( string ) {
    var utils_includepattern = /#include <(.*)>/gm;
    
    function replace( match , include ) {
        var replace = THREE.ShaderChunk[ include ];
        return Utils.parseIncludes( replace );
    }

    return string.replace( utils_includepattern, replace );
}

Utils.last = function(array) {
    return array[array.length - 1];
}

export default Utils;