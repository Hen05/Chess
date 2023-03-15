var boardColumns = ["a", "b", "c", "d", "e", "f", "g", "h"];
    
let genBoard = {
    get: function(){
        //empty arr
        let arr = [];

        return this.board(arr);
    },

    board: function(arr) {
            //Creating the sqr's of board, row by row
            for(let row = 8; row >= 1; row--){
                for(column of boardColumns){
                    //Creating the element 
                    arr.push({"pos": `${column}${row}`, "piece": ""});
                }
            }
        this.pieces.genPieces(arr);
        return arr;
    },

    pieces : {
        setOfPieces: [
            //board set
            {type:"pawn", 
            amount:"8", 
            whitePos:["a2", "b2", "c2", "d2", "e2", "f2", "g2", "h2"], 
            blackPos:["a7", "b7", "c7", "d7", "e7", "f7", "g7", "h7"]},
            {type:"rook", 
            amount:"2", 
            whitePos:["a1", "h1"], 
            blackPos:["a8", "h8"]},
            {type:"knight", 
            amount:"2", 
            whitePos:["b1", "g1"], 
            blackPos:["b8", "g8"]},
            {type:"bishop", 
            amount:"2", 
            whitePos:["c1", "f1"], 
            blackPos:["c8", "f8"]},
            {type:"queen", 
            amount:"1", 
            whitePos:["d1"], 
            blackPos:["d8"]},
            {type:"king", 
            amount:"1", 
            whitePos:["e1"], 
            blackPos:["e8"]},
        ],
    
        piecesColor: ["white", "black"],
    
        genPieces: function(arr) {
            //Creating each pieces, by type
            this.setOfPieces.forEach(piece =>{
                //Color by color
                this.piecesColor.forEach(color=>{
                    //Getting piece type
                    let type = piece.type;
    
                    //Creating amount of pieces
                    for(let amount = 0; amount < piece.amount; amount++){
                        //Getting the start position, id, e image
                        let id = `${type}-${amount+1}-${color}`
                        let actualPos = piece[`${color}Pos`][amount];
           
                        //Creating piece
                        let newPiece = {id, type, color, actualPos, moved: false};
                
                        arr.filter(sqr => sqr.pos == actualPos)[0].piece = newPiece
                    }
                })
            })
        }
    }
}