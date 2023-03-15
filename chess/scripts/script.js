const assets = {
    //ref of pieces img
    //JohnPablok's improved Cburnett chess set.

    pawn:{white: "./assets/pieces/w_pawn_svg_NoShadow.svg",
    black: "./assets/pieces/b_pawn_svg_NoShadow.svg"},

    rook:{white: "./assets/pieces/w_rook_svg_NoShadow.svg",
    black: "./assets/pieces/b_rook_svg_NoShadow.svg"},

    knight:{white: "./assets/pieces/w_knight_svg_NoShadow.svg",
    black: "./assets/pieces/b_knight_svg_NoShadow.svg"},
          
    bishop:{white: "./assets/pieces/w_bishop_svg_NoShadow.svg",
    black: "./assets/pieces/b_bishop_svg_NoShadow.svg"},
    
    queen:{white: "./assets/pieces/w_queen_svg_NoShadow.svg",
    black: "./assets/pieces/b_queen_svg_NoShadow.svg"},

    king:{white: "./assets/pieces/w_king_svg_NoShadow.svg",
    black: "./assets/pieces/b_king_svg_NoShadow.svg"}
}

let divProm = document.querySelector(".promotion");

document.addEventListener("DOMContentLoaded", ()=>{
    let startBtn = document.querySelector("#start-btn");
    startBtn.addEventListener("click", startGame);
})

function startGame(){
    this.style.display = "none";
    document.querySelector("h1").style.display = "none";

    createBoard();

    newTurn();
}

function createBoard(){
    //Board Container
    let board = document.createElement("div");
    board.id = "board";

    //Getting virtual board
    let vBoard = gl.board;

    //Board colors
    let boardColors = ["light", "dark"];
    
    //Actual color
    let actColor = 0;
    
    //Creating board
    vBoard.forEach(sqr=>{
        let pos = sqr.pos;
        let piece = sqr.piece;
        let color = boardColors[actColor];
    
        //Adding sqrs
        board.appendChild(createSqr(pos, color, piece));

        //Checking if is the last column
        if(pos[0] == "h"){
            actColor = actColor == 0 ? 1: 0; 
        }

        //Color change
        actColor = actColor == 0 ? 1 : 0;
    })
    
    //Putting board on document
    let container = document.querySelector(".container");
    container.appendChild(board);
}

function createSqr(pos, color, piece){
    //creating sqr
    let sqrDiv = document.createElement("div");
    sqrDiv.className = "sqr";
    sqrDiv.setAttribute("color", color);
    sqrDiv.setAttribute("pos", pos);

    //creating piece if the sqr has one
    if(piece != ""){
        let pieceType = piece.type;
        let pieceId = piece.id;
        let pieceColor = piece.color;
        
        sqrDiv.appendChild(createPiece(pieceType, pieceId, pieceColor))
    }

    return sqrDiv;
}

function createPiece(type, id, color){
    //creating piece
    let piece = document.createElement("div"); 
    piece.className = "piece"
    piece.id = id;
    piece.setAttribute("color", color);
    piece.setAttribute("type", type);
    piece.style.backgroundImage = `url(${assets[type][color]})`;

    return piece;
}

function newTurn(){
    if(gl.kingChecked != ""){
        if(gl.kingChecked != ""){
            let king = document.querySelector(`#${gl.kingChecked}`);
            king.style.backgroundColor = "";
        }
    }

    let turn = gl.newTurn();

    let oldSelected = document.querySelector(`[selected]`);
    
    if(oldSelected != null){
        oldSelected.removeAttribute("selected");
    }

    let pieces = document.querySelectorAll(".piece");
    pieces.forEach(piece =>{
        piece.removeEventListener("click", selected);
    });

    let turnPieces = document.querySelectorAll(`[color="${turn.turn}"]`);

    turnPieces.forEach(piece =>{
        piece.addEventListener("click", selected);
    })

    if(gl.kingChecked != ""){
        let king = document.querySelector(`#${gl.kingChecked}`);
        king.style.backgroundColor = "red";
    }

    if(turn.winner == ""){
        getMoves(turn.moves);
    } else{
        gameOver(turn.winner);
    }
    
}

function getMoves(pieces){
    
    pieces.forEach(piece =>{
        let movesFlat = [];
        let id = piece.id;
        let moves = piece.moves;
        
        moves.forEach(dir =>{
            movesFlat.push(dir.moves);
        })

        movesFlat = movesFlat.flat();

        movesFlat = movesFlat.filter(move => move.legal == true);


        movesFlat.forEach(move =>{
            
            let position = move.position;
            let type = move.type;
            let target = type == "castle" ? JSON.stringify(move.target) : move.target;
           
            if(type != "check"){
                genMove(id, position, type, target);
            }
        })
    })
}

function genMove(id, position, type, target){

    let sqr = document.querySelector(`[pos=${position}]`);
    let trigger = createTrigger(id, type, target);       
    sqr.appendChild(trigger);
        
}

function createTrigger(id, type, target){
    let trigger = document.createElement("div");
    trigger.className = "trigger";
    trigger.setAttribute("piece", id);
    trigger.setAttribute("type", type);

    if(target != ""){
        trigger.setAttribute("target", target)
    }

    trigger.addEventListener("click", movePiece);
    
    return trigger;
}

function selected(){
    let oldSelected = document.querySelector(`[selected]`);
    
    if(oldSelected != null){
        oldSelected.removeAttribute("selected");
    }

    this.setAttribute("selected", "");
    showMoves(this);
}

function showMoves(piece){
    let id = piece.id;
    let oldTriggers = document.querySelectorAll("[active]");
    let triggers = document.querySelectorAll(`[piece="${id}"]`);
    
    oldTriggers.forEach(trigger=>{
        trigger.removeAttribute("active");
    })

    triggers.forEach(trigger=>{
        trigger.setAttribute("active", "");
    })
}

function removeTriggers(){
    let triggers = document.querySelectorAll(".trigger");
    triggers.forEach(trigger =>{
        trigger.remove();
    })
}

function movePiece(){
    let type = this.getAttribute("type");
    let id = this.getAttribute("piece");
    let piece = document.querySelector(`#${id}`);
    let sqr = this.parentNode;
    let position = sqr.getAttribute("pos");
    let targetId = this.getAttribute("target");

    switch (type){
        case "castle":
        targetId = JSON.parse(targetId);
        let startPos = targetId.startPos;
        let newPos = targetId.newPos;
        
        let king = document.querySelector(`[pos="${startPos.king}"]`).querySelector(".piece");
        let rook = document.querySelector(`[pos="${startPos.rook}"]`).querySelector(".piece");
        let kingNewSqr = document.querySelector(`[pos="${newPos.king}"]`);
        let rookNewSqr = document.querySelector(`[pos="${newPos.rook}"]`);
        
        kingNewSqr.appendChild(king);
        rookNewSqr.appendChild(rook);
        break;

        case "en passant":
        case "capture":
            let target = document.querySelector(`#${targetId}`);
            target.remove();
        default:
            sqr.appendChild(piece);   
    }

    removeTriggers();
    gl.movePiece(id, position, type, targetId);
    newTurn();  



    
}

function promotion(piece){
    divProm.style.display = "flex";
    let btnProm = document.querySelectorAll(".btn-prom");
    let color = piece.color;
    let id = piece.id;

    btnProm.forEach(btn =>{
        let type = btn.id;
        btn.style.backgroundImage = `url(${assets[type][color]})`
        btn.addEventListener("click", (e)=>{
            changeImage(id, color, e.target.id);  
            gl.promotePiece(id, e.target.id);
            divProm.style.display = "none";
        })
    })
}   

function changeImage(piece, color, type){ 
    let pawn = document.querySelector(`#${piece}`);
    pawn.setAttribute("type", type)
    pawn.style.backgroundImage = `url(${assets[type][color]})`
}

function gameOver(winner){
    let gameOverScreen = document.querySelector(".gameover");
    let winnerDiv = document.querySelector("#winner");
    winnerDiv.textContent = " " + winner;
    
    gameOverScreen.style.display = "flex";

    setTimeout(()=>{
        gameOverScreen.style.opacity = 1;
    }, 10)
}