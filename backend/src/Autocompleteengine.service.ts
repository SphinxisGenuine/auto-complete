import { Trie, type Wordinfo } from "./trie.js";
export class AutocCompleteservice{
    private trie = new Trie()
    loadDictionary(words: Wordinfo[]) {
        for (const word of words) {
            this.trie.insert(word.word,word.freqency);
        }
    }
    autocomplete(word:string,limit:number=5){
        //negative keep it positvie swap it 
        let suggestion=this.trie.getSuggestion(word)
        return suggestion
    }
    recordselection(word:string):boolean{

        const result =this.trie.RecordSelection(word)
        return result   
    }


}