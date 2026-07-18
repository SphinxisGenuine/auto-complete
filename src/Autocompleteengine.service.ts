import { Trie } from "./trie.js";
export class AutocCompleteservice{
    private trie = new Trie()
    loadDictionary(words: string[]) {
        let index=0;
        for (const word of words) {
            this.trie.insert(word,words.length-index);
            index++;
        }
    }
    autocomplete(word:string,limit:number=5){
        //negative keep it positvie swap it 
        let suggestion=this.trie.getSuggestion(word)
        let ne = suggestion.sort((a, b) => b.freqency - a.freqency).slice(0,limit)
        return ne
    }


}