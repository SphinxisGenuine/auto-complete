import { instance } from "./index.js";
function autocomplete (word:string){
let array:string[]=instance.childrens(word)
return array
}