import { noShowAdvice, quietestDay } from './insights';

describe('quietestDay', () => {
  //            Sun Mon Tue Wed Thu Fri Sat
  const week = [0, 6, 2, 7, 6, 9, 10];
  const openMonSat = new Set([1, 2, 3, 4, 5, 6]);

  it('finds the open day well below the average', () => {
    expect(quietestDay(week, openMonSat)).toEqual({ weekday: 2, day: 'Tuesday', bookings: 2, averageBookings: 6.7 });
  });

  it('ignores days the business is closed', () => {
    // Sunday has 0 bookings but is closed, so it isn't "quiet".
    expect(quietestDay(week, openMonSat)?.day).not.toBe('Sunday');
  });

  it('stays quiet without enough bookings, or when days are even', () => {
    expect(quietestDay([0, 1, 0, 2, 1, 3, 2], openMonSat)).toBeNull();
    expect(quietestDay([0, 6, 5, 6, 6, 5, 6], openMonSat)).toBeNull();
  });
});

describe('noShowAdvice', () => {
  it('suggests deposits when no-shows are common and some services are pay-on-arrival', () => {
    expect(noShowAdvice(18, 3, 2)).toEqual({ noShows: 3, rate: 0.143 });
  });

  it('stays quiet when rare, too little data, or every service already takes payment', () => {
    expect(noShowAdvice(40, 2, 2)).toBeNull();
    expect(noShowAdvice(5, 2, 2)).toBeNull();
    expect(noShowAdvice(18, 3, 0)).toBeNull();
  });
});
