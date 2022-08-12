
const LINES = 3
const O = -1
const X = 1
const _ = 0

const putMark = function(row, column, mark)
{
    let square = document.getElementById('sq_'+(LINES * row + column))
    switch(mark)
    {
        case _: square.innerHTML=''
        break;
        case O: square.innerHTML='<i class="fa fa-circle-o" aria-hidden="true"></i>'
        break;
        case X: square.innerHTML='<i class="fa fa-times" aria-hidden="true"></i>'
        break;
    }
}


