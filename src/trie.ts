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
}
