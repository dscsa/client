export class InventoryDate{
    constructor(dateOrDateString = null) {

        if(dateOrDateString instanceof Date){
            this.date = dateOrDateString;
        }
        else if(typeof dateOrDateString === 'string'){
            //YYYY-MM-DDTHH:MM:SS or YYYY-MM-DD HH:MM:SS (space vs T)
            //return format is an array :
            //[dateString, YYYY, MM, DD, HH, MM, SS]
            const dateParts = dateOrDateString.match(/(\d{4})-(\d{2})-(\d{2})[T\s](\d{2}):(\d{2}):(\d{2})/);

           console.log(dateParts);
            this.date = this.makeDate(
                dateParts[1],
                //function uses 0 based month value. 0 - 11 rather than 1-12 like the calendar
                parseInt(dateParts[2], 10) - 1,
                dateParts[3]
            );
        }
        else this.date = new Date();
    }

    makeDate(y, m, d){
        const date = new Date();

        date.setFullYear(y);
        date.setMonth(m);
        date.setDate(d);

        return date;
    }

    addMonths(numMonths){
        this.date.setMonth(this.date.getMonth() + numMonths);
        return this;
    }

    components(){
        return {
            month:this.date.getMonth(),
            day:this.date.getDate(),
            year: this.date.getFullYear()
        };
    }

    copyDate(){
        return this.makeDate(...Object.values(this.components()));
    }

    copy(){

    }

    willExpire(){
        let oneMonthFromToday = new InventoryDate().addMonths(1);
        console.log(oneMonthFromToday, this.date);
        return oneMonthFromToday > this.date;
    }
}