type Suggestion={
word :string;
freqency:number;
}

class Trienode{
    children :Record<string,Trienode>={};
    isEndOfWord:boolean=false;
    freqency:number;
    constructor() {
        this.children = {};
        this.isEndOfWord = false;
        this.freqency= -1;
    }
    
}
export class Trie {
    private root:Trienode;
    constructor(){
        this.root=new Trienode;
    }
    insert (word:string,freqency:number):void{
        let node =this.root;
        for (const char of word){
            if (!node.children[char]){
                node.children[char]=new Trienode()
            }
        node=node.children[char];
        } 
        node.isEndOfWord=true;
        node.freqency=freqency
    }
    search(word:string){
        let node = this.root;
        for (const char of word){
            if (!node.children[char]){
                return false 
            }
            node=node.children[char];
        }
        return node.isEndOfWord
    }
    startsWith(prefix: string): boolean {
    let current = this.root;

    for (const char of prefix) {
        if (!current.children[char]) {
            return false;
        }

        current = current.children[char];
    }

    return true;
}   
    private dfs(node:Trienode,suggestion:Suggestion[],currentword:string){
            if (node.isEndOfWord){
                suggestion.push({word:currentword,freqency:node.freqency})
            }
        for (const [childLetter,childNode] of Object.entries(node.children)){
            this.dfs(childNode,suggestion,currentword+childLetter)
        }
        
    }
    getSuggestion(word:string){
        let current=this.root
        let arrayofSuggestion:Suggestion []=[];
        for (const char of word){
            if (!current.children[char]){
                return []
            }
            current=current.children[char];
        }
        let temp = current;
         this.dfs(temp,arrayofSuggestion,word);
         return arrayofSuggestion!
    }
}
