class Trienode{
    children :Record<string,Trienode>={};
    isEndOfWord:boolean=false;
    constructor() {
        this.children = {};
        this.isEndOfWord = false;
    }
}
export class Trie {
    private root:Trienode;
    constructor(){
        this.root=new Trienode;
    }
    insert (word:string):void{
        let node =this.root;
        for (const char of word){
            if (!node.children[char]){
                node.children[char]=new Trienode()
            }
        node=node.children[char];
        } 
        node.isEndOfWord=true;
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
    private dfs(node:Trienode,suggestion:string[],currentword:string){
        if(suggestion.length===5){
            return suggestion
        }
        for (const [childLetter,childNode] of Object.entries(node.children)){
            if (childNode.isEndOfWord){
                suggestion.push(currentword+childLetter)
            }
            this.dfs(childNode,suggestion,currentword+childLetter)
        }
        
    }
    childrens(word:string){
        let current=this.root
        let arrayofSuggestion:string []=[];
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
