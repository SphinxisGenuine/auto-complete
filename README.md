## Why I built this ?

 the main reason when i was thinkink about Building a serch engine like google i was staring at google serch bar and thinking what componets i can see and also while some gooling and curiosity lead me to think what goes behind a auto complete 

The first if soomeones think to build this How we will We store the word u know there will be 1000 of words stroing it in array is the worst DS to start with becasuue we we cant itrete 10 of thousands word at scale it will very bad THe data structure whcih is used to for this work solution to this problem is 

### Trie 
Trie data structure is prefix based string serching data structure which is highly fast lookups making it highly effective in handling large datasets.

Trie contains nodes each node contain a key which will bee a letter and a boolean is wordtrue which says true at the end of word at the second itretion of building it i have the freqency in the node also 

for the version 1 the dictionory was having around a 100k words so inserting was simple it was inserting a node and with frequency and the search feutre has to take all the words and rank them and give top 5 elments but serching it was  a qestion we can see it to build a word we need to go recurseivle in every node untill we reah the terminal node so DFS was the solution this was also not very good tehineqe 


The Trie solved prefix lookup, but not ranking
so here come upgrade to trie node my node was having a letter ,isendofword,children ,freqwncy but to avoid dfs for every time time was little problem to my goal which was submillisecond qery time so 

i had made imporovement in my node what i did was added the TOp_K which was array which maintain top k wordsobj which contains word and freqency so at the time insert or while time builds topk is made so every time the user serches my trie dosent dffs a million nodes to build words which most of them discardes dinsted it just serves them an cache TOPK array which interstingly faster than before we need the freqency to be update at every serch so the topk be actually relevant so for  that purpose every time user selects the 

 
selction is recoreded and it updates the frequency + the topk these make it bit more  dynamic 


That means every selection has to update the Trie
But I also didn't want autocomplete requests waiting for updates.
So I want to  separated reads and writes next task

The current implementation keeps autocomplete reads extremely fast. My next iteration is to move selection updates to a background worker so read latency remains unaffected even under heavy write traffic

Autocomplete remains a fast read.
Selections become asynchronous jobs processed by a worker
The worker updates the frequency and then walks back through the Trie updating the Top-K cache.
 
Persistance Next thing to tackle was this becasue every time loading from a dictionory file wasnt a problem a problem was the freqency will be staic it should according to the real traffic if moree user slect "application" it should go up so i added freqency but the freqency should be sustain the serveer restart so what i thogt i was my trie  will be still in the memoery the words will loaded from the storage for which i coverted the txt to csv so that i can insert in one go which is fast and proper way to do this so next obv thigs to handle db write whih should be asychronous that should mainatian latency and keep it low the ultimalte goal is to  <10ms as much as possible  

I almost Completed the Asynchronous write this was mostly Understaning how the Rabbitmq i somewhat know how an qeue because off one project which i started so it was so=mooth sailing then actually too code from docs and pasted it and understood how it was working then started modifhing it seeing how and what breaks then finally i connected all the peices together 
- The words .txt file coverts to the .csv
- .csv loads in db
- Trie at every start loads from the db and build 
- at the interface which is wrapper of trie i handled selection recordings
- then finally iwrote the consumer /worker which takes the word updates it ccount in the db and also the inmemory trie which id i think about it came out so beautifully like WOAH

//todo
api for handling the selction and forwarding it  to the queue
seeing wheter i an batch updates 
seeing if i can add cache here  somewhere if need as per my current knowledge or understanding i dont need one becasue whole trie is in my inmeemory so i dont think its needed



next things to do  
{Batch frequency updates before writing to the database}
- worker asychronous 
- load balncing 
- rate limiting the api

-Observibality (Learn and add ) 
Metrics{
Requests/sec
Queue length
Worker throughput
Average autocomplete latency
}