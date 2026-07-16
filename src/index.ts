import { Trie } from "./trie.js";

const instance = new Trie();

instance.insert("cat")
instance.insert("cats")
instance.insert("caterpiller")
let bool =instance.search("cater")
console.log(bool);
