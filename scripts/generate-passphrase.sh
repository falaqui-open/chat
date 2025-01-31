#!/bin/bash

word_list=(
    "abandon" "hope" "erase" "fish" 
    "typeset" "cumbersome" "threatening" "chip" 
    "progress" "pacify" "crush" "foamy" "weigh" 
    "faithful" "sneeze" "ocean" "chance" "recollect" 
    "wire" "size" "blow" "flesh" "safe" 
    "scatter" "escape" "use" "melted" "day" 
    "vague" "veil" "magical" "triumph" "control" 
    "early" "vengeful" "messy" "axiomatic" "contemn" 
    "detach" "adjust" "icy" "notice" "tank" 
    "mistake" "sore" "crack" "box" "convers" 
    "drain" "sand" "wistful" "internal" "savory" 
    "impinge" "geese" "unsuitable" "reflect" "appear" 
    "spin" "spot" "youthful" "giant" "territory" "spurious" 
    "trampl" "overflow" "patch" "crowded" "owl" "scab" 
    "dry" "gabby" "wine" "gaping" "aback" "ingest" 
    "bad" "egg" "nostalgic" "secure" "sister" "march" 
    "fly" "mew" "jittery" "tall" "soar" "stir" 
    "popcorn" "quiver" "enlarge" "aboard" "behave" 
    "travel" "promise" "lettuce" "pardon" "color" "repulsive"
    "screw" "squeak" "satisfy" "joy" "squeamish" "squeal"
    "agreement" "nest" "pear" "fog" "mug" "block"
    "revival" "immune" "transport" "ward" "practice" 
    "ask" "soil" "mouse" "acceptance" "girlfriend" 
    "psychology" "quality" "cash" "profound" "writer" 
    "cooperation" "rotten" "association" "agony" "attract" 
    "option" "ray" "astonishing" "muscle" "worth" 
    "satisfaction" "stubborn" "confusion" "fork" "thanks" 
    "faint" "service" "anniversary" "power" "peasant" "century" 
    "suffering" "theater" "world" "union" "dark" 
    "persist" "bee" "culture" "choke" "similar" 
    "ghostwriter" "share" "liberty" "fist" "society"
)

# Generate 20 words for encrypt_passphrase
amount=20
encrypt_passphrase=$(shuf -e "${word_list[@]}" -n $amount | tr '\n' ' ')
echo $encrypt_passphrase