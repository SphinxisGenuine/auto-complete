import { Trie } from "./trie.js";
export class AutocCompleteservice{
    private trie = new Trie()
    loadDictionary(words: string[]) {
        for (const word of words) {
            this.trie.insert(word);
        }
    }
    autocomplete(word:string){
        return this.trie.childrens(word)
    }


}