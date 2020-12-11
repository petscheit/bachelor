

export const broadcastTrade = async (tradeArgs) => {
    const requestOptions = {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(tradeArgs)
    };
    const response = await fetch('http://localhost:3005/trade', requestOptions);
    const data = await response.json();
    console.log(data)
}