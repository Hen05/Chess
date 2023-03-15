let gl = {
    board: genBoard.get(),

    winner: "",

    moves: [],

    kingChecked: "",

    check: [],

    checkMode: [],

    lastMove: "",

    turn: "white",

    newTurn: function () {
        this.moves = [];
        this.kingChecked = "";

        //pieces without kings
        let pieces = this.board.filter(sqr => sqr.piece != "" && sqr.piece.type != "king");

        //kings
        let kings = this.board.filter(sqr => sqr.piece != "" && sqr.piece.type == "king");

        //Gen Moves
        this.genMoves(pieces, kings);

        //getting the turn moves
        let filtered = this.moves.filter(element => element.color == this.turn);

        let turn = this.turn
        //changing for the next turn and reseting checks and pins
        this.turn = this.turn == "white" ? "black" : "white";
        this.check = [];
        this.pins = [];

        

        return {moves: filtered, winner:this.winner, turn};
    },

    genMoves: function (pieces, kings) {
        let movesFlat = { white: [], black: [] };
        let pins = [];
        //genMoves for all piece except the kings
        pieces.forEach(sqr => {
            let piece = sqr.piece;
            let temp = this.calcMovesAndCheck(piece);
            let newMoves = temp.moves;

            if(temp.truePin.length != 0){
                pins.push(temp.truePin[0]);
            } 
            //adding moves to the array of moves
            this.moves.push(newMoves);
            //adding moves to the flat array
            newMoves.moves.forEach(pieceMoves => {

                pieceMoves.moves.forEach(move => {
                    let repeat = movesFlat[piece.color].indexOf(move.position);

                    if ((repeat == -1 && move.legal) || (move.type == "capture" && piece.type == "pawn")
                        || (move.type == "protection")) {
                        movesFlat[piece.color].push(move);
                    }

                })
            })
        });

        if(pins.length > 0){
            pins.forEach(pin =>{
                let pinned = pin[0];
                let attacker = pin[1];
                let position = pin[2];
                

                let movesPinned = this.moves.find(element => element.id == pinned);
                
                let movesAttacker = this.moves.find(element => element.id == attacker);
                let pieceAttacker = this.board.find(element => element.piece.id == attacker);
               
                let direction = [pieceAttacker.piece.actualPos];

                movesAttacker.moves.forEach(dir =>{
                   
                    for(move of dir.moves){
                      
                        if(direction.length > 1){
                            break;
                        }
            
                        if(move.position == position){
                            dir.moves.forEach(move =>{
                                
                                if(move.legal == true){
                                    direction.push(move.position);
                                }
                            })
                        } 
                    }
                })

                
                movesPinned.moves.forEach(dir =>{
                    dir.moves.forEach(move =>{
                         if(move.legal == true){
                            for(let dirMove of direction){
                               if(dirMove == move.position){
                                   move.legal = true;
                                   break;
                               } else{
                                    move.legal = false;
                               }
                            }
                        }
                    })
                })
            })
        }

        //genMoves for King
        kings.forEach(sqr => {
         
            let piece = sqr.piece;
         
            this.moves.push(this.calcMovesAndCheck(piece, movesFlat).moves);
        });

        //checking if is check (1 round before)
        if(this.check.length > 0){
            this.checkFilter();
        }

        //checking if is check (round)
        if (this.checkMode.length > 0){
            this.checkOn()
            this.checkMode = [];
        } else {
            this.calcSpecialMoves(movesFlat);
        } 
    },

    calcMovesAndCheck: function (piece, movesFlat) {
        //Getting piece informations
        let id = piece.id;
        let type = piece.type;
        let color = piece.color;
        let actualPos = piece.actualPos;
        let pieceColumn = actualPos[0];
        let columnIndex = boardColumns.indexOf(pieceColumn);
        let pieceRow = Number(actualPos[1]);
        let moved = piece.moved;
        let moves;
        let legal = true;
        let pin = [];
        let truePin = [];

        //Calc the moves acording the type of piece
        switch (type) {

            case "pawn":
                //Black Or White
                let dir = color == "white" ? 1 : -1;
                moves = dir == 1 ?
                    [{ dir: "up", moves: [] },
                    { dir: "diagonals", moves: [] }] :

                    [{ dir: "down", moves: [] },
                    { dir: "diagonals", moves: [] }];

                if (moved == false) {
                    for (let i = 1; i < 3; i++) {
                        let position = pieceColumn + (pieceRow + dir * i);

                        let temp = this.checkCollision(id, position, color, legal, "move");
                        let move = temp.move;
                        legal = temp.legal;

                        moves[0].moves.push(move);
                    }
                } else if(pieceRow + dir > 0 && pieceRow + dir < 9) {
                    let position = pieceColumn + (pieceRow + dir);

                    let temp = this.checkCollision(id, position, color, legal, "move");
                    let move = temp.move;
                    legal = temp.legal;

                    moves[0].moves.push(move);
                }

                legal = true;

                for (let i = columnIndex - 1; i < columnIndex + 2; i += 2) {
                    if (i >= 0 && i < 8 && 
                        pieceRow + dir > 0 && pieceRow + dir < 9) {

                        let position = boardColumns[i] + (pieceRow + dir);

                        let temp = this.checkCollision(id, position, color, legal, "capture");
                        let move = temp.move;

                        moves[1].moves.push(move);
                    }

                }
                break;

            case "knight":
                moves = [{ dir: "free", moves: [] }];
                for (let i = -2; i <= 2; i += 4) {
                    let column = columnIndex - i;
                    for (let i = -1; i < 2; i += 2) {
                        let row = pieceRow + i;
                        if (row > 0 && row <= 8 && column >= 0 && column < 8) {
                            let position = boardColumns[column] + row;

                            let temp = this.checkCollision(id, position, color, legal);
                            let move = temp.move;

                            moves[0].moves.push(move);
                        }
                    }
                    let row = pieceRow - i;
                    for (let i = -1; i < 2; i += 2) {
                        let column = columnIndex + i;
                        if (row > 0 && row <= 8 && column >= 0 && column < 8) {
                            let position = boardColumns[column] + row;

                            let temp = this.checkCollision(id, position, color, legal);
                            let move = temp.move;

                            moves[0].moves.push(move);
                        }
                    }
                }
                break;

            case "rook":
                moves = [
                    { dir: "up", moves: [] }, { dir: "down", moves: [] },
                    { dir: "left", moves: [] }, { dir: "right", moves: [] }
                ];
                //up
                for (let row = pieceRow + 1; row < 9; row++) {
                    let position = boardColumns[columnIndex] + row;

                    let temp = this.checkCollision(id, position, color, legal, undefined, pin);

                    let move = temp.move;
                    legal = temp.legal;

                    if(temp.pinned != "" && pin != temp.pinned){
                        pin.push(temp.pinned);
                    } else if(pin == temp.pinned && pin.length != 0){
                        truePin = pin;
                    }

                    moves[0].moves.push(move);
                }

                legal = true;
                pin = [];

                //down
                for (let row = pieceRow - 1; row > 0; row--) {
                    let position = boardColumns[columnIndex] + row;

                    let temp = this.checkCollision(id, position, color, legal, undefined, pin);

                    let move = temp.move;
                    legal = temp.legal;
                    
                    if(temp.pinned != "" && pin != temp.pinned){
                        pin.push(temp.pinned);
                    } else if(pin == temp.pinned && pin.length != 0){
                        truePin = pin;
                    }

                    moves[1].moves.push(move);
                }

                legal = true;
                pin = [];

                //left
                for (let column = columnIndex - 1; column >= 0; column--) {
                    let position = boardColumns[column] + pieceRow;

                    let temp = this.checkCollision(id, position, color, legal, undefined, pin);

                    let move = temp.move;
                    legal = temp.legal;

                    if(temp.pinned != "" && pin != temp.pinned){
                        pin.push(temp.pinned);
                    } else if(pin == temp.pinned && pin.length != 0){
                        truePin = pin;
                    }

                    moves[2].moves.push(move);
                }

                legal = true;
                pin = [];

                //right
                for (let column = columnIndex + 1; column < 8; column++) {
                    let position = boardColumns[column] + pieceRow;

                    let temp = this.checkCollision(id, position, color, legal, undefined, pin);

                    let move = temp.move;
                    legal = temp.legal;

                    if(temp.pinned != "" && pin != temp.pinned){
                            pin.push(temp.pinned);
                        } else if(pin == temp.pinned && pin.length != 0){
                            truePin = pin;
                    }

                    moves[3].moves.push(move);
                }

                break;

            case "bishop":
                moves = [
                    { dir: "up-left", moves: [] }, { dir: "down-left", moves: [] },
                    { dir: "down-right", moves: [] }, { dir: "up-right", moves: [] }
                ];

                for (let i = -1; i < 2; i += 2) {

                    let row = Number(pieceRow) + i;
                    let column = columnIndex + i;

                    //Diagonals -- and ++
                    while (row > 0 && row < 9 && column >= 0 && column < 8) {
                        let position = boardColumns[column] + row;

                        let temp = this.checkCollision(id, position, color, legal, undefined, pin);

                        let move = temp.move;
                        legal = temp.legal;

                        if(temp.pinned != "" && pin != temp.pinned){
                            pin.push(temp.pinned);
                        } else if(pin == temp.pinned && pin.length != 0){
                            truePin = pin;
                        }

                        moves[2 + i].moves.push(move);

                        row += i;
                        column += i;
                    }

                    legal = true;
                    pin = [];
                    row = Number(pieceRow) + i;
                    column = columnIndex - i;

                    //Diagonals -+ and +-
                    while (row > 0 && row < 9 && column >= 0 && column < 8) {
                        let position = boardColumns[column] + row;

                        let temp = this.checkCollision(id, position, color, legal, undefined, pin);

                        let move = temp.move;
                        legal = temp.legal;
                        
                        if(temp.pinned != "" && pin != temp.pinned){
                            pin.push(temp.pinned);
                        } else if(pin == temp.pinned && pin.length != 0){
                            truePin = pin;
                        }

                        moves[1 - i].moves.push(move);

                        row += i;
                        column -= i;
                    }

                    legal = true;
                    pin = [];
                }

                break;

            case "queen":
                moves = [
                    { dir: "up", moves: [] }, { dir: "down", moves: [] },
                    { dir: "left", moves: [] }, { dir: "right", moves: [] },
                    { dir: "up-left", moves: [] }, { dir: "down-left", moves: [] },
                    { dir: "down-right", moves: [] }, { dir: "up-right", moves: [] }
                ];
                //up
                for (let row = pieceRow + 1; row < 9; row++) {
                    let position = boardColumns[columnIndex] + row;

                    let temp = this.checkCollision(id, position, color, legal, undefined, pin);

                    let move = temp.move;
                    legal = temp.legal;

                    if(temp.pinned != "" && pin != temp.pinned){
                        pin.push(temp.pinned);
                    } else if(pin == temp.pinned && pin.length != 0){
                        truePin = pin;
                    }

                    moves[0].moves.push(move);
                }

                legal = true;
                pin = [];

                //down
                for (let row = pieceRow - 1; row > 0; row--) {
                    let position = boardColumns[columnIndex] + row;

                    let temp = this.checkCollision(id, position, color, legal, undefined, pin);

                    let move = temp.move;
                    legal = temp.legal;
                    
                    if(temp.pinned != "" && pin != temp.pinned){
                        pin.push(temp.pinned);
                    } else if(pin == temp.pinned && pin.length != 0){
                        truePin = pin;
                    }

                    moves[1].moves.push(move);
                }

                legal = true;
                pin = [];

                //left
                for (let column = columnIndex - 1; column >= 0; column--) {
                    let position = boardColumns[column] + pieceRow;

                    let temp = this.checkCollision(id, position, color, legal, undefined, pin);

                    let move = temp.move;
                    legal = temp.legal;

                    if(temp.pinned != "" && pin != temp.pinned){
                        pin.push(temp.pinned);
                    } else if(pin == temp.pinned && pin.length != 0){
                        truePin = pin;
                    }

                    moves[2].moves.push(move);
                }

                legal = true;
                pin = [];

                //right
                for (let column = columnIndex + 1; column < 8; column++) {
                    let position = boardColumns[column] + pieceRow;

                    let temp = this.checkCollision(id, position, color, legal, undefined, pin);

                    let move = temp.move;
                    legal = temp.legal;

                    if(temp.pinned != "" && pin != temp.pinned){
                            pin.push(temp.pinned);
                        } else if(pin == temp.pinned && pin.length != 0){
                            truePin = pin;
                    }

                    moves[3].moves.push(move);
                }

                legal = true;
                pin = [];

                //diagonals
                for (let i = -1; i < 2; i += 2) {

                    let row = Number(pieceRow) + i;
                    let column = columnIndex + i;

                    //Diagonals -- and ++
                    while (row > 0 && row < 9 && column >= 0 && column < 8) {
                        let position = boardColumns[column] + row;

                        let temp = this.checkCollision(id, position, color, legal, undefined, pin);

                        let move = temp.move;
                        legal = temp.legal;

                        if(temp.pinned != "" && pin != temp.pinned){
                            pin.push(temp.pinned);
                        } else if(pin == temp.pinned && pin.length != 0){
                            truePin = pin;
                        }

                        moves[6 + i].moves.push(move);

                        row += i;
                        column += i;
                    }

                    legal = true;
                    pin = [];
                    row = Number(pieceRow) + i;
                    column = columnIndex - i;

                    //Diagonals -+ and +-
                    while (row > 0 && row < 9 && column >= 0 && column < 8) {
                        let position = boardColumns[column] + row;

                        let temp = this.checkCollision(id, position, color, legal, undefined, pin);

                        let move = temp.move;
                        legal = temp.legal;
                        
                        if(temp.pinned != "" && pin != temp.pinned){
                            pin.push(temp.pinned);
                        } else if(pin == temp.pinned && pin.length != 0){
                            truePin = pin;
                        }

                        moves[5 - i].moves.push(move);

                        row += i;
                        column -= i;
                    }

                    legal = true;
                    pin = [];
                }

                break;

            case "king":
                moves = [{ dir: "free", moves: [] }];
                for (let i = -1; i <= 1; i++) {
                    let column = columnIndex - i;

                    for (let index = -1; index <= 1; index++) {
                        let row = pieceRow - index;
                        let position = boardColumns[column] + row;
                        if (row > 0 && row <= 8 &&
                            column >= 0 && column < 8 &&
                            position != actualPos) {
                            let opponentColor = color == "white" ? "black" : "white";
                            let sqr = movesFlat[opponentColor].find(element => element.position == position);

                            if (sqr == undefined) {
                                let temp = this.checkCollision(id, position, color, legal);
                                let move = temp.move;
                                
                                moves[0].moves.push(move);
                            }
                        }
                    }
                }
        }

        
        return {moves: {id, type, color, moves}, truePin: truePin};
    },

    checkCollision: function (id, position, color, legal, pawn, pin) {
        let type = "move";
        let sqr = gl.board.find(sqr => sqr.pos == position);
        let piece = sqr.piece;
        let pinned = "";

        if (piece == "") {
            if (pawn == "capture") {
                type = "capture";
                legal = false;
            }

            return { move: { position, type, target: "", legal }, legal, pinned }
        } else if (piece.type != "king" || pawn != undefined) {
            if (pawn == "move") {
                legal = false;
                return { move: { position, type, target: "", legal }, legal, pinned }
            }

            type = piece.color == color ? "protection" : "capture";

            legal = type == "protection" ? false : legal;

            
            if(type == "capture"){
                pinned = [piece.id, id, position];
            }


            return { move: { position, type, target: piece.id, legal }, legal: false, pinned}
        } else {

            type = piece.color == color ? "empty" : "check";

            if(pin != undefined && pin.length > 0 && pin.length < 2){
                pinned = pin;
            }
            

            if (legal == true && piece.color != color) {
                this.check.push({piece: id, king: piece.id});
            }

            legal = false;

            return { move: { position, type, target: piece.id, legal }, legal, pinned }
        }

    },

    calcSpecialMoves: function (movesFlat) {
        //Castle
        let row = this.turn == "white" ? 1 : 8;
        let color = this.turn == "white" ? "black" : "white";

        let king = gl.board.find(element => element.pos == "e" + row);
        let kingMoves = this.moves.find(element => element.type == "king" && element.color == this.turn);

        if (king.piece.moved == false) {
            let rooks = [gl.board.find(element => element.pos == "a" + row),
            gl.board.find(element => element.pos == "h" + row)];
            //large castle    
            if (rooks[0].piece.moved == false) {
                for (let column = 1; column < 4; column++) {
                    let position = boardColumns[column] + row;
                    let sqr = gl.board.find(element => element.pos == position);
                    let move = movesFlat[color].find(element => element == position);
        
                    if (sqr.piece != "" || move != undefined) {
                        break;
                    } else if (column == 3) {

                        kingMoves.moves[0].moves.push({
                            position: boardColumns[2] + row, type: "castle", target: {
                                startPos: { rook: "a" + row, king: "e" + row },
                                newPos: { rook: "d" + row, king: "c" + row }
                            }, legal: true
                        });
                    }
                }
            }
            //small castle
            if (rooks[1].piece.moved == false) {
                for (let column = 5; column < 7; column++) {
                    let position = boardColumns[column] + row;
                    let sqr = gl.board.find(element => element.pos == position);
                    let move = movesFlat[color].find(element => element == position);
                    
                    if (sqr.piece != "" || move != undefined) {
                        break;
                    } else if (column == 6) {

                        kingMoves.moves[0].moves.push({
                            position: boardColumns[6] + row, type: "castle", target: {
                                startPos: { rook: "h" + row, king: "e" + row },
                                newPos: { rook: "f" + row, king: "g" + row }
                            }, legal: true
                        });

                    }
                }
            }
        }
        //En Passant
        if (this.lastMove.type == "pawn") {

            let pos = this.lastMove.actualPos;
            let column = pos[0];
            let columnIndex = boardColumns.indexOf(column);
            let row = Number(pos[1]);
            let startRow = this.lastMove.color == "white" ? 2 : 7;
            let index = this.lastMove.color == "white" ? +1 : -1;


            if (row == startRow + index * 2) {
                for (let i = -1; i < 2; i += 2) {
                    if (columnIndex + i > 0 && columnIndex + i < 8) {
                        let position = boardColumns[columnIndex + i] + row;
                        let sqr = gl.board.find(element => element.pos == position);
                        if (sqr.piece != "" && sqr.piece.color == this.turn) {
                            let moves = this.moves.find(element => element.id == sqr.piece.id).moves;
                            let position = boardColumns[columnIndex] + (row - index);
                            moves.push({ dir: "special", moves: { position, type: "en passant", target: this.lastMove.id, legal: true } });
                        }
                    }
                }
            }
        }

        //Pawn Promotion
        if (this.lastMove.type == "pawn"){
            let row = this.lastMove.actualPos[1];
            let prom = color == "white" ? 8 : 1;
            if(row == prom){
                promotion(this.lastMove);
            }
        }
    },

    checkFilter: function () {
        if(this.check.length > 1){

        } else{
            let kingId = this.check[0].king;
            let pieceId = this.check[0].piece;

            let kingBoard = this.board.find(element => element.piece.id == kingId);
            let kingPos = kingBoard.pos;
        
            let pieceBoard = this.board.find(element => element.piece.id == pieceId);
            let piecePos = pieceBoard.pos;
            let pieceMoves = this.moves.find(element => element.id == pieceId);
            
            this.checkMode.push(piecePos);            
            
            for(let dir of pieceMoves.moves){
               
                if(dir.moves.find(element => element.position == kingPos) != undefined){
                    for(let move of dir.moves){
                        if(move.position == kingPos){
                            break;
                        } else{
                            this.checkMode.push(move.position);
                        }
                    }
                    break;
                }
            }
    
        }
    },

    checkOn: function (){
        let legalMoves = [];
        let newLegal = [];
        let turnMoves = this.moves.filter(element => element.color == this.turn && element.type != "king");
        let kingMoves = this.moves.find(element => element.color == this.turn && element.type == "king");
        let kingId = kingMoves.id;

        this.kingChecked = kingId;
        
        turnMoves.forEach(piece => {
            piece.moves.forEach(dir =>{
               dir.moves.forEach(move =>{
                if(move.legal == true){
                    legalMoves.push(move);
                }
               })
            })
        })

        legalMoves.forEach(move =>{
            for(let pos of this.checkMode){
                if(move.position == pos){
                    newLegal.push(move);
                    break;
                } else if(this.checkMode[this.checkMode.length - 1] == pos){
                    move.legal = false;
                }
            }
        });

        kingMoves.moves[0].moves.forEach(move =>{
            if(move.legal == true){
                newLegal.push(move);
            }
        })

        if(newLegal.length == 0){
            this.checkmate();
        }
    },

    movePiece: function (id, position, type, target) {
        let boardPieces = this.board.filter(element => element.piece != "");
        let pieceSqr = boardPieces.find(element => element.piece.id == id);
        pieceSqr.piece.moved = true;
        let newSqr = this.board.find(element => element.pos == position);

        switch (type) {

            case "castle":
                let startPos = target.startPos;
                let newPos = target.newPos;

                let kingSqr = gl.board.find(element => element.pos == startPos.king);
                let rookSqr = gl.board.find(element => element.pos == startPos.rook);
                let kingNewSqr = gl.board.find(element => element.pos == newPos.king);
                let rookNewSqr = gl.board.find(element => element.pos == newPos.rook);

                kingNewSqr.piece = kingSqr.piece;
                kingSqr.piece = "";

                rookNewSqr.piece = rookSqr.piece;
                rookSqr.piece = "";

                rookNewSqr.piece.actualPos = newPos.rook;
                kingNewSqr.piece.actualPos = newPos.king;

                this.lastMove = "castle";
                break;

            case "en passant":
                let targetSqr = this.board.find(element => element.piece.id == target);
                targetSqr.piece = "";
            case "capture":
                newSqr.piece = "";
            default:
                newSqr.piece = pieceSqr.piece;
                pieceSqr.piece = "";
                newSqr.piece.actualPos = newSqr.pos;
                this.lastMove = newSqr.piece;
        }
    },

    checkmate: function (){
        this.winner = this.turn == "white" ? "black" : "white";
    },

    promotePiece: function(id, type){
        let piece = gl.board.find(element => element.piece.id == id).piece;
        piece.type = type;
        let moves = this.moves.find(element => element.id == piece);
        console.log(piece);
        console.log(moves);
    }
}


