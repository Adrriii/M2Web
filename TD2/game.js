const LOGTYPE = {
    ERROR: 0,
    MSG: 1,
    WARNING: 2,
    DEBUG: 3,
};
const DISPLAYTYPE = {
    WIN: "result_win",
    LOSE: "result_lose",
    TIE: "result_tie",
};

let LOGLEVEL = LOGTYPE.MSG;

function Log(msg, type) {
    if(type > LOGLEVEL) return;

    switch(type) {
        case 0:
            console.log("Error! "+msg);
            return;
        case 1:
            console.log(msg);
            return;
        case 2:
            console.log("Warning: "+msg);
            return;
        case 3:
            console.log("DEBUG "+msg);
            return;
    }
}

function displayResult(msg, style = DISPLAYTYPE.TIE) {
    document.getElementsByClassName("result")[0].innerHTML = msg;
    document.getElementsByClassName("result")[0].className = "result "+style;
}

class Game {
    constructor(playerName, playerBalance) {
        this.bank = new Player("Bank", 1000, "bank");
        this.player = new Player(playerName, playerBalance, "player");
        this.pot = 0;

        this.deck = new Deck();
        this.deck.ShowContents();

        this.newRound();
    }

    newRound() {
        this.bank.discard().forEach(card => { this.deck.InsertBottom(card)});
        this.player.discard().forEach(card => { this.deck.InsertBottom(card)});

        this.draw(this.bank);
        this.draw(this.player);
        this.draw(this.player);

        this.bank.balance -= 50;
        this.player.balance -= 50;
        this.pot = 100;

        this.refresh();
        this.setPlayable(true);
    }

    setPlayable(playable) {
        this.playable = playable;
        if(!playable) {
            document.getElementsByClassName("pick_button")[0].className = "action_button pick_button disabled";   
            document.getElementsByClassName("call_button")[0].className = "action_button call_button disabled";   
        } else {
            document.getElementsByClassName("pick_button")[0].className = "action_button pick_button";   
            document.getElementsByClassName("call_button")[0].className = "action_button call_button"; 
        }
    }

    refreshScore() {
        document.getElementsByClassName("score")[0].innerHTML = this.player.getScore();
    }

    refreshBet() {
        document.getElementsByClassName("bet")[0].innerHTML = this.pot / 2;
    }

    refresh() {
        this.refreshBet();
        this.refreshScore();
        this.bank.refresh();
        this.player.refresh();
    }

    draw(player) {
        player.getCard(this.deck.Pick());
    }

    win(player) {
        player.balance += this.pot;
        this.pot = 0;
        this.setPlayable(false);
    }

    push() {
        this.player.balance += this.pot/2;
        this.bank.balance += this.pot/2;
        this.pot = 0;
        this.setPlayable(false);
    }

    hit() {
        if(!this.playable) return;
        this.draw(this.player);
        this.refresh();

        if(this.player.getScore() > 21) {
            displayResult("Bust!", DISPLAYTYPE.LOSE);
            this.win(this.bank);
        }
    }

    stand() {
        if(!this.playable) return;
        while(this.bank.getScore()<17) {
            this.draw(this.bank);
        }
        this.refresh();
        
        let bs = this.bank.getScore();
        let ps = this.player.getScore();

        if(bs > 21) {
            displayResult("Bank Bust!", DISPLAYTYPE.WIN);
            this.win(this.player);
        }
        else if(bs > ps) {
            displayResult("Bank wins!", DISPLAYTYPE.LOSE);
            this.win(this.bank);
        }
        else if(bs < ps) {
            displayResult("You win!", DISPLAYTYPE.WIN);
            this.win(this.player);
        }
        else if(bs == ps) {
            displayResult("Push!", DISPLAYTYPE.TIE);
            this.push();
        }
    }

    dd() {

    }

    next() {
        this.bank.balance += this.pot;
        this.pot = 0;
        displayResult("");
        this.newRound();
    }
}

class Player {
    constructor(name, money, classtag) {
        this.name = name;
        this.balance = money;
        this.classtag = classtag;
        this.discard();
    }

    discard() {
        let cards = this.hand;
        this.hand = [];
        return cards;
    }

    getCard(card) {
        this.hand.push(card);
    }

    refreshHand() {
        let hand = "";

        this.hand.forEach(card => {
            hand += card.getHtml();
        });

        document.getElementsByClassName(this.classtag+"_hand")[0].innerHTML = hand;
    }

    refreshBalance() {
        document.getElementsByClassName(this.classtag+"_money_amount")[0].innerHTML = this.balance;
    }

    refreshName() {
        document.getElementsByClassName(this.classtag+"_money_title")[0].innerHTML = this.name;
    }

    refresh() {
        this.refreshHand();
        this.refreshBalance();
        this.refreshName();
    }

    getScore() {
        let score = 0;
        let n = 0;
        let soft = false;
        this.hand.forEach(card => {
            n++;

            Log(this, LOGTYPE.DEBUG);
            let val = card.getValue();
            if(val == 1) {
                soft = true; // if has an at least an ace (soft)
                val = 11;
            }
            score += val;
        });

        if(score > 21 && soft) { // diminished ace if bust on soft
            score -= 10;
        }

        return score;
    }
}

const CardNumbers = ["A","2","3","4","5","6","7","8","9","10","J","Q","K"];
const CardColors = ["C","D","H","S"];

class Deck {
    constructor() {
        this.cards = [];

        CardNumbers.forEach(N => {
            CardColors.forEach(C => {
                this.cards.push(new Card(N,C));
            })
        });

        this.shuffle();
    }

    shuffle() {
        for (let i = this.cards.length - 1; i > 0; i--) {
            let j = Math.floor(Math.random() * (i + 1));
            [this.cards[i], this.cards[j]] = [this.cards[j], this.cards[i]];
        }
    }

    Pick() {
        return this.cards.pop();
    }

    InsertBottom(card) {
        this.cards.unshift(card);
    }

    ShowContents() {
        let i = 0;
        this.cards.forEach(card => {
            Log((i++) + ": "+card.toString(), LOGTYPE.DEBUG);
        });
    }
}

class Card {
    constructor(number, color) {
        if(CardNumbers.includes(number) && CardColors.includes(color)) {
            this.number = number;
            this.color = color;
        } else {
            Log("Tried to create impossible card : "+number+color, LOGTYPE.ERROR);
        }
    }

    getImg() {
        return "img/cards/"+this.toString()+".png";
    }

    getHtml() {
        return "<div class=\"card\" style=\"background-image: url('"+this.getImg()+"');\"></div>";
    }

    getValue() {
        return Math.min(CardNumbers.findIndex((e) => e == this.number)+1,10);
    }

    toString() {
        return this.number+this.color;
    }
}

//////////////

let game = new Game(prompt("Enter your username", "Player"), 500);