"""Agents -> database"""
"""database -> functions"""
"""functions->model"""
"""model alert ->show alert in dashboard"""
"""model automate -> flag and fix sus devices"""

from sklearn.ensemble import RandomForestClassifier
from sklearn.model_selection import train_test_split
import pandas as pd
import numpy as np

df = pd.read_csv("exampleDataset.csv")

x=df.drop(columns=["ipaddr","name","suspecious"])
y=df["suspecious"]


model=RandomForestClassifier(random_state=42)


model.fit(x,y)

print("traineddd")