let game;

function start(name) {
    game = new Game(name, 500);
}

////////////////

const LOGTYPE = {
    ERROR: 0,
    MSG: 1,
    WARNING: 2,
    DEBUG: 3,
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
        this.bank.discard();
        this.player.discard();

        this.draw(this.bank);
        this.draw(this.bank);
        this.draw(this.player);
        this.draw(this.player);

        this.bank.balance -= 50;
        this.player.balance -= 50;
        this.pot = 100;

        this.refresh();
    }

    refreshScore() {
        document.getElementsByClassName("score")[0].innerHTML = this.player.getScore();
    }

    refreshBet() {
        document.getElementsByClassName("bet")[0].innerHTML = this.pot;
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

    hit() {

    }

    stand() {

    }

    dd() {

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
        this.hand = [];
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
        this.hand.forEach(card => {
            score += card.getValue();
            Log(score, LOGTYPE.MSG);
        });

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
            console.log("Tried to create impossible card : "+number+color, LOGTYPE.ERROR);
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