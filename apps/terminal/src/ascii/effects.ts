/**
 * Animation frame sequences for different actions.
 */
export const ACTION_EFFECTS: Record<string, string[]> = {
  reading: [
    " [=  ] ",
    " [ = ] ",
    " [  =] ",
    " [ = ] ",
  ],
  writing: [
    " /__ ",
    " _/_ ",
    " __/ ",
    " _/_ ",
  ],
  testing: [
    " *--/ ",
    " /--* ",
    " *--/ ",
    " /--* ",
  ],
  thinking: [
    " .   ",
    " ..  ",
    " ... ",
    " ..  ",
  ],
  searching: [
    " >   ",
    " >>  ",
    " >>> ",
    " >>  ",
  ],
  coding: [
    " {_} ",
    " {#} ",
    " {_} ",
    " {=} ",
  ],
};
