# MAPA DEL CÓDIGO · Caudal v1

Generado solo. Sirve para orientarse: busca siempre por el nombre de la función, las líneas cambian.

- constante `APP_VERSION` · línea 204

## Utilidades (línea 206)
- `localDate(d)` · línea 215
- `addDays(s,n)` · línea 216
- `monthAdd(m,n)` · línea 218
- constante `MONTHS` · línea 219
- `fmtDate(s,o={day:'numeric',month:'short'})` · línea 222
- `nf(n,d=2,min=d)` · línea 223
- `money(eur,opts={})` · línea 225
- `toNum(v)` · línea 236
- `toDate(v,dmy=true)` · línea 246
- constante `ICON` · línea 257

## Estado y guardado (línea 272)
- `defaults()` · línea 274
- `load()` · línea 295
- `migrate(o)` · línea 300
- `save(sync=true)` · línea 307
- `change(fn,msg)` · línea 313
- `undo()` · línea 319
- `toast(text,canUndo=false)` · línea 320

## Categorías (línea 327)
- constante `CATS` · línea 329
- constante `RULES_BASE` · línea 341
- `merchantOf(desc)` · línea 362
- `categorize(t)` · línea 370

## Importar archivos (Excel .xlsx y CSV) (línea 380)
- `unzip(buf)` · línea 382
- `readXlsx(buf)` · línea 397
- `parseCSV(text)` · línea 414
- `findHeader(rows,needles)` · línea 428
- constante `FORMATS` · línea 433
- `detect(rows)` · línea 441
- `col(hs,...names)` · línea 445
- `parseBank(rows,fmt,head)` · línea 447
- `normAsset(a)` · línea 462
- `binanceKind(op,acct)` · línea 467
- `krakenKind(type,sub)` · línea 479
- `parseLedger(rows,fmt,head,map)` · línea 488
- `readFile(file)` · línea 519
- `importFiles(files)` · línea 525
- `openImport(rows,det,fname,map)` · línea 537
- `openMapper(rows,fname)` · línea 573
- `importBackup(o)` · línea 595

## Activos y precios (línea 601)
- constante `FIAT` · línea 602
- constante `STABLE` · línea 603
- constante `CLASS_NAMES` · línea 604
- constante `CLASS_COLOR` · línea 605
- `ensureAsset(sym)` · línea 606
- `priceEUR(sym)` · línea 609
- `fx(cur)` · línea 615
- `trackedAssets()` · línea 617
- `refreshPrices(force=false)` · línea 624
- `directPrices(cryptos)` · línea 639
- `priceAt(sym,t)` · línea 647

## Cartera: qué tienes y cuánto vale (línea 664)
- `bankBalance(a)` · línea 665
- `positionRows()` · línea 674
- `derivRows()` · línea 686
- `netWorth()` · línea 695
- `snapshot()` · línea 702
- `bankHistory(days=365)` · línea 709
- `netSeries(days)` · línea 720

## Movimientos: resúmenes del mes (línea 727)
- `monthTotals(m)` · línea 728
- `lastMonths(n)` · línea 735
- `recurring()` · línea 737

## Fiscalidad (España): FIFO, base del ahorro, borrador (línea 749)
- constante `TRAMOS_AHORRO` · línea 751
- `cuotaAhorro(base)` · línea 752
- `matchTransfers(L)` · línea 754
- `taxGroups()` · línea 760
- `taxPrefetch(onStep)` · línea 766
- `taxCompute()` · línea 775
- `balancesAt(date)` · línea 816
- `modelo721(year)` · línea 817
- `taxSummary(year,extra=0)` · línea 823
- `byCoin(disp)` · línea 828

## Conexión con el Worker (exchanges, precios, sincronización) (línea 830)
- `api(path,opts={})` · línea 831
- constante `EXCH` · línea 843
- `syncBalances(manual=false)` · línea 845

## Sincronización cifrada entre dispositivos (línea 865)
- `syncKey()` · línea 869
- `syncId()` · línea 870
- constante `LOCAL_ONLY` · línea 871
- `syncPayload()` · línea 872
- `encrypt(obj)` · línea 873
- `decrypt(s)` · línea 879
- `mergeStates(local,remote)` · línea 885
- `scheduleSync()` · línea 896
- `syncNow(manual=false)` · línea 897
- `paintSync()` · línea 917
- `pairLink()` · línea 924
- `readPair()` · línea 925

## Avisos (línea 934)
- `alerts()` · línea 935

## Gráficos (SVG propios, sin librerías) (línea 952)
- `svgLine(pts,{h=170,w=640}={})` · línea 953
- `svgMonths(months)` · línea 966
- `allocBar(parts,total)` · línea 971

## Navegación (línea 977)
- constante `VIEWS` · línea 978
- constante `TABS` · línea 979
- `go(v,f)` · línea 981
- `renderNav()` · línea 982
- `render()` · línea 988
- `head(title,sub,actions='')` · línea 996

## Resumen (línea 999)
- `vResumen()` · línea 1000
- `onboarding()` · línea 1026
- `txItem(t)` · línea 1034

## Movimientos (línea 1039)
- `filtered()` · línea 1040
- `vMovs()` · línea 1045
- `editTx(id)` · línea 1061

## Inversiones (línea 1073)
- `costBasis()` · línea 1074
- `vInv()` · línea 1075
- `accTable(rows)` · línea 1100
- constante `OPK` · línea 1104
- `opsTable(ops)` · línea 1105
- `assetDetail(sym)` · línea 1110
- `editOp(id)` · línea 1120
- `editDeriv(id)` · línea 1132

## Impuestos (línea 1145)
- `vTax()` · línea 1147
- `taxCSV(year)` · línea 1171
- `taxAIText(year)` · línea 1180

## Cuentas (línea 1191)
- constante `KIND_NAMES` · línea 1192
- `vCuentas()` · línea 1193
- `editAcc(id)` · línea 1201

## Ajustes (línea 1212)
- constante `WORKER_STEPS` · línea 1213
- `vAjustes()` · línea 1214
- `workerInfoHTML(i)` · línea 1236
- `vMas()` · línea 1241

## Ventana, descargas y acciones (línea 1248)
- `modal(title,html)` · línea 1249
- `download(name,text,type='application/json')` · línea 1250
- `copyText(t,msg='Copiado')` · línea 1251
- `act(a,el)` · línea 1255
- `confirmTwice(el)` · línea 1321
- `afterRender()` · línea 1351

## Arranque (línea 1361)
- `init()` · línea 1362
