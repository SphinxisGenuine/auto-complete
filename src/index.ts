import { Trie } from "./trie.js";

export const instance = new Trie();

instance.insert("cat");
instance.insert("cats");
instance.insert("car");
instance.insert("care");
instance.insert("camera");
instance.insert("can");
instance.insert("camp");
instance.insert("cup");
instance.insert("cut");
instance.insert("dog");

console.log(instance.childrens("ca"))