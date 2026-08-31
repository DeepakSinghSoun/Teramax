"""Agents -> database"""
"""database -> functions"""
"""functions->model"""
"""model alert ->show alert in dashboard"""
"""model automate -> flag and fix sus devices"""

from sklearn.ensemble import RandomForestClassifier
from sklearn.model_selection import train_test_split
import pandas as pd
import numpy as np
from sklearn.metrics import accuracy_score 
df = pd.read_csv("exampleDataset.csv")

x=df.drop(columns=["ipaddr","name","suspecious"])
y=df["suspecious"]


X_train , X_test , y_train , y_test = train_test_split(x,y,test_size=0.2 , random_state=42)


model=RandomForestClassifier(random_state=42 , class_weight="balanced")


model.fit(X_train , y_train)
y_predict=model.predict(X_test)

print(f"MODEL ACCURACY : {accuracy_score(y_test , y_predict)*100:.2f}% \n")
