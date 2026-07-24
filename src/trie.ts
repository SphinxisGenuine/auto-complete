type Suggestion={
word :string;
freqency:number;
}
type Wordinfo ={
    word:string;
    freqency:number
}
class Trienode{
    children :Record<string,Trienode>={};
    isEndOfWord:boolean=false;
    freqency:number;
    TopK:Wordinfo[];
    constructor() {
        this.children = {};
        this.isEndOfWord = false;
        this.freqency= -1;
        this.TopK=[];
    }

}
export class Trie {
    private root:Trienode;
    constructor(){
        this.root=new Trienode;
    }

    //v1 needed it 
    private dfs(node:Trienode,suggestion:Suggestion[],currentword:string){
            if (node.isEndOfWord){
                suggestion.push({word:currentword,freqency:node.freqency})
            }
        for (const [childLetter,childNode] of Object.entries(node.children)){

            this.dfs(childNode,suggestion,currentword+childLetter)
        }
    }
    insert (word:string,freqency:number):void{
        let node =this.root;
        const wordInfo = {
             word,
              freqency
            };
        for (const char of word){
            if (!node.children[char]){
                node.children[char]=new Trienode()
            }
            node=node.children[char];
            this.updateTopk(node,wordInfo)
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
    getSuggestion(word:string){
        let current=this.root
        for (const char of word){
            if (!current.children[char]){
                return []
            }
            current=current.children[char];
        }
         return current.TopK

    }

    

    // for deltion we need 2 things first we till deopth of the node

    //  and we have to keep track of the parent node
    private readonly Top_K=8;
    private updateTopk(node:Trienode,wordobj:Wordinfo){
        //is the word exist update its frequncy 
         const existingIndex = node.TopK.findIndex(entry => entry.word === wordobj.word);

        if (existingIndex!=-1){
            node.TopK[existingIndex]!.freqency = wordobj.freqency;
            node.TopK.sort((a, b) => b.freqency - a.freqency);
            return
        }
        // if it not full push simply push
        if(node.TopK.length < this.Top_K) {
            node.TopK.push(wordobj);

        node.TopK.sort((a, b) => b.freqency - a.freqency);
        return;
        }

        // if the above two condition fails that means the word is is not in the topk 
        // what we need to do is check the freqency of smallest in the topk and update the list 
        const last = node.TopK[node.TopK.length - 1]!;

        if (wordobj.freqency > last.freqency) {
            node.TopK[node.TopK.length - 1] =wordobj;
        node.TopK.sort((a, b) => b.freqency - a.freqency);
        console.log(node.TopK)
        }
       
    }
    RecordSelection(word:string):boolean{
         let current=this.root
         let cuurent2=current
         let newfreqency
         for (const char of word){
            if (!cuurent2.children[char]){
                return false
            }
            cuurent2=cuurent2.children[char];
        } 
        if (!cuurent2.isEndOfWord) {
           return false;
            }
        cuurent2.freqency++
        newfreqency=cuurent2.freqency
            const wordobj:Wordinfo={word:word,freqency:newfreqency}
        for (const char of word){
            if (!current.children[char]){
                return true
            }
            current=current.children[char];
            this.updateTopk(current,wordobj)
        }
         return true
    }



    

   private deleteWord(node: Trienode, word: string, index: number): boolean {

    if (index === word.length) {

        if (!node.isEndOfWord) {

            return false;

        }

        node.isEndOfWord = false;

        node.freqency = -1;

        return Object.keys(node.children).length === 0;

    }

    const char = word[index];

    const child = node.children[char!];

    if (!child) {

        return false;

    }

    const shouldDeleteChild = this.deleteWord(child, word, index + 1);



    if (shouldDeleteChild) {

        delete node.children[char!];

    }



    return (

        !node.isEndOfWord &&

        Object.keys(node.children).length === 0

    );

}

    delete(word: string): void {

    this.deleteWord(this.root, word, 0);

    }



}