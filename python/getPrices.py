import request

def getPrice():
    res=request.get("https://api.raydium.io/coin/price")
    return res.json

def getPairs():
    res=request.get("https://api.raydium.io/pairs")
    return res.json