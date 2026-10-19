import numpy as np
import pandas as pd

np.random.seed(42)
n_samples=10

ip_address=[f"192.169.1.{np.random.randint(2,254)}" for _ in range(n_samples)]

names=[f"workstation{np.random.randint(1,10)}" for _ in range(n_samples)]


usb=np.random.choice([True,False], size=n_samples)

sscan=np.random.choice([True,False],size=n_samples)

sus_command=np.random.choice([True,False],size=n_samples , p=[0.35 , 0.65])


suspecious=[]
for i in range(n_samples):
    score=0
    if sscan[i]:
        score+=4
    if sus_command[i]:
        score+=5
    if usb[i]:
        score+=2

    is_suss = score>=4
    suspecious.append(is_suss)

df=pd.DataFrame({"ipaddr":ip_address,
                     "name":names,
                     "usbConnected":usb,
                     "stealthScan":sscan,
                     "susCommands":sus_command,
                     "suspecious":suspecious,})


print(df)

df.to_csv("exampleDataset.csv" , index=False)
